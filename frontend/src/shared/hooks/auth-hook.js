import {useState, useCallback, useEffect} from 'react';


//定义在component外边因为它是behind-scene data从而不会收到component render的影响
let logoutTimer;

export const useAuth = () => {
  const [token, setToken] = useState(false);
	const [tokenExpirationDate, setTokenExpirationDate] = useState();

	const [userId, setUserId] = useState(false);

	const login = useCallback((uid, token, expirationDate) => {
		setToken(token);
		setUserId(uid);
		//get current time and add one hour (getTime()得到的是mili seconds)
		//如果用户已经login了，那就用当前exparitionDate作为tokenExpirationTime；
		//如果是token过期或刚打开app第一次login，
		//就用now + 1 hour来生成一个tokenExpirationTime
		const tokenExpirationTime =
			expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60);

		setTokenExpirationDate(tokenExpirationTime);

		//把token存在browser的local storage里从而在页面刷新时保持登陆
		//localStorage is a global javaScript browser API
		//用JSON.stringify因为local storage只能储存text，不能储存object，用stringify把
		//token变成text
		localStorage.setItem(
			"userData",
			JSON.stringify({
				userId: uid,
				token: token,
				expiration: tokenExpirationTime.toISOString()
			})
		);
	}, []);

	const logout = useCallback(() => {
		setToken(null);
		//set the token expiration date to null after we logged out
		//so next time when we login we won't be immediately logged out
		setTokenExpirationDate(null);
		setUserId(null);
		//clear the token when we log out:
		localStorage.removeItem("userData");
	}, []);

	useEffect(() => {
		//Set up auto logout when the token expired 
		//and also when user clicks logout
		if (token && tokenExpirationDate) {
			//Deduct 'now' from tokenExpirationDate to get the remaining time
			const remainingTokenValidTime =
				tokenExpirationDate.getTime() - new Date().getTime();
			logoutTimer = setTimeout(logout, remainingTokenValidTime);
		} else {
			//If user manually click logout, we don't have a token anymore, so clear our timer
			clearTimeout(logoutTimer);
		}
	}, [token, logout, tokenExpirationDate]);

	//No other dependencies so this method will only run once when the app is first rendered
	//useEffect() runs after the render cycle, after the component is rendered by React
	useEffect(() => {
		//JSON.parse converts json text to regular javaScript objects
		//Now storedData will be the object we stored ({userId: userId, token: token})
		const storedData = JSON.parse(localStorage.getItem("userData"));
		if (
			storedData &&
			storedData.token &&
			//如果storedData中的expiration（tokenExpirationTime）大于现在的时间
			//就说明token还没过期
			new Date(storedData.expiration) > new Date()
		) {
			login(
				storedData.userId,
				storedData.token,
				new Date(storedData.expiration)
			);
		}
	}, [login]);

  return {token, login, logout, userId};
}