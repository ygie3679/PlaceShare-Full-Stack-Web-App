import React, { Suspense } from "react";

import {
	BrowserRouter as Router,
	Route,
	Redirect,
	Switch,
} from "react-router-dom";
// import Users from "./user/pages/Users";
// import NewPlace from "./places/pages/NewPlace";
import MainNavigation from "./shared/components/Navigation/MainNavigation";
// import UserPlaces from "./places/pages/UserPlaces";
// import UpdatePlace from "./places/pages/UpdatePlace";
// import Auth from "./user/pages/Auth";
import { AuthContext } from "./shared/context/auth-context";
import { useAuth } from "./shared/hooks/auth-hook";
import LoadingSpinner from "./shared/components/UIElements/LoadingSpinner";

//Use React.lazy() to only imoprt a component when it's required
//instead of importing it immediately when the App.js file runs, when the application starts
const Users = React.lazy(() => import("./user/pages/Users"));
const NewPlace = React.lazy(() => import("./places/pages/NewPlace"));
const UserPlaces = React.lazy(() => import("./places/pages/UserPlaces"));
const UpdatePlace = React.lazy(() => import("./places/pages/UpdatePlace"));
const Auth = React.lazy(() => import("./user/pages/Auth"));

//The "Users" will be rendered if URL path is "/":
const App = () => {
	const { token, login, logout, userId } = useAuth();

	let routes;
	if (token) {
		routes = (
			<Switch>
				<Route path="/" exact={true}>
					<Users />
				</Route>

				<Route path="/:userId/places" exact>
					<UserPlaces />
				</Route>

				<Route path="/places/new" exact>
					<NewPlace />
				</Route>

				<Route path="/places/:placeId">
					<UpdatePlace />
				</Route>

				<Redirect to="/" />
			</Switch>
		);
	} else {
		routes = (
			<Switch>
				<Route path="/" exact={true}>
					<Users />
				</Route>

				<Route path="/:userId/places" exact>
					<UserPlaces />
				</Route>

				<Route path="/auth">
					<Auth />
				</Route>
				<Redirect to="/auth" />
			</Switch>
		);
	}

	return (
		<AuthContext.Provider
			value={{
				isLoggedIn: !!token,
				token: token,
				userId: userId,
				login: login,
				logout: logout,
			}}
		>
			<Router>
				<MainNavigation />
				<main>
					<Suspense
					//make sure if loading the new route that user wants to access takes longer time, 
					//Suspense can run whatever in the fallback function and display it to user
						fallback={
							<div className="center">
								<LoadingSpinner />
							</div>
						}
					>
						{routes}
					</Suspense>
				</main>
			</Router>
		</AuthContext.Provider>
	);
};

export default App;
