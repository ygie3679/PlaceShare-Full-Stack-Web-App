import { useState, useCallback, useRef, useEffect } from "react";

//This functioin does all setIsLoading, setError...etc stuff for us
export const useHttpClient = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState();

	//useRef turns this array into a reference, which is a piece of data that won't be
	//reinitialized or won't change when this function runs again
	const activeHttpRequests = useRef([]);

	const sendRequest = useCallback(
		async (url, method = "GET", body = null, headers = {}) => {
			setIsLoading(true);
			const httpAbortCtrl = new AbortController();
			activeHttpRequests.current.push(httpAbortCtrl);

			try {
				const response = await fetch(url, {
					method,
					body,
					headers,
					//Use AbortController to cancel this connected request
					signal: httpAbortCtrl.signal,
				});

				const responseData = await response.json();

        //fiter out the controller that was responsible for this specific request
        //so that we won't use this request controller to cancel this request that isn't its responsibility
				activeHttpRequests.current = activeHttpRequests.current.filter(
					(reqCtrl) => reqCtrl !== httpAbortCtrl
				);

				//response.ok will be true only when we have a 2XX status code
				if (!response.ok) {
					throw new Error(responseData.message);
				}
				setIsLoading(false);
				return responseData;
			} catch (err) {
				setError(err.message);
				setIsLoading(false);
				throw err;
			}
		},
		[]
	);

	const clearError = () => {
		setError(null);
	};

	useEffect(() => {
		return () => {
			activeHttpRequests.current.forEach((abortCtrl) => abortCtrl.abort());
		};
	}, []);

	return { isLoading, error, sendRequest, clearError };
};
