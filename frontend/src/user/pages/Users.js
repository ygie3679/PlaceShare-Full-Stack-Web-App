import React, { useEffect, useState } from "react";
import UsersList from "../components/UsersList";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";

const Users = () => {
	const {isLoading, error, sendRequest, clearError} = useHttpClient();

	const [loadedUsers, setLoadedUsers] = useState();

	useEffect(() => {
		const fetchUsers = async () => {

			try {
				//With fetch(), the default request type is a GET request
				const responseData = await sendRequest(process.env.REACT_APP_BACKEND_URL + "/users");

				setLoadedUsers(responseData.users);

			} catch (err) {}
		};
		fetchUsers();
	}, [sendRequest]);

	//Make the Users component clean and consice
	//so we build a separate UsersList component and just use it here:
	return (
		<React.Fragment>
			<ErrorModal error={error} onClear={clearError} />
			{isLoading && (
				<div className="center">
					<LoadingSpinner />
				</div>
			)}

			{!isLoading && loadedUsers && <UsersList items={loadedUsers} />}
		</React.Fragment>
	);
};

export default Users;
