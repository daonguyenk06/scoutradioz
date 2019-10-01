const express = require('express');
const router = express.Router();
const utilities = require('../utilities');
const bcrypt = require('bcryptjs');
const passport = require('passport');

/*
0) '/user' redirects to '/user/login'
1) Page (user/login.pug) shows a dropdown of existing organizations '/user/login'
2) User selects org from dropdown
3) User enters org's password ("password" ad "password2" for now)
4) POST: '/user/login' takes org_key and password
5) Redirect to '/user/login/select', goes to orgs db and compares password
6a) if fail, redirect to '/user/login?alert=Incorrect password for organization ___'
6b) If correct, go to users db and get all users under that organization
7) Page (user/selectuser.pug) shows a dropdown of users '/user/login/select'
8) AJAX POST: '/user/login/withoutpassword' takes "name"
	a) go to users db and search for name. If user doesn't exist, return JSON {status: 500, alert: "User does not exist in database"}
	b) get user's role; go to roles db and find access_level of that role
	c) if access_level > process.env.ACCESS_SCOUTER, then return {status: 200, password_needed: true}
	d) if access_level == process.env.ACCESS_SCOUTER, then return {status: 307, password_needed: false, redirect_url: '/dashboard'}
	e) if access_level < process.env.ACCESS_SCOUTER, then return {status: 307, password_needed: false, redirect_url: '/'}
9) Page (user/selectuser.pug) responds to AJAX
	a) if status == 500 or alert exists, send prompt w/ alert to user
	b) if password_needed == false, then redirect to redirect_url
	c) if password_needed == true, then open a password prompt
10) User enters password and clicks Log In
	a) Sends AJAX POST to '/user/login/withpassword' and compares password
	b) Return: 
		{status:500, alert: "User does not exist in database" }
		{status:500, alert: "User does not have a password in database" }
		{status:400, alert" "Incorrect password" }
		{status:200, redirect_url: "/admin" }

*/

//Redirect to /user/login
router.get('/', async function(req, res){
	res.redirect(301, "/user/login");
});

//1) Page (user/login.pug) shows a dropdown of existing organizations '/user/login'
//2) User selects org from dropdown
//3) User enters org's password ("password" ad "password2" for now)
router.get('/login', async function (req, res){
	
	//Get list of participating organizations.
	var orgs = await utilities.find("orgs", {}, {});
	
	if(!orgs || !orgs[0]){
		throw new Error("user.js /login: No organizations exist in 'orgs' collection in database.");
	}
	
	//Prepare an alert. (Used w/ url /?alert=(alert))
	if(req.query) var alert = req.query.alert || null;
	
	res.render('./user/login', {
		title: "Select Organization",
		orgs: orgs,
		alert: alert
	});
});

//4) POST: '/user/login' takes org_key and password
//5) Redirect to '/user/login/select', goes to orgs db and compares password
router.post('/login', async function(req, res){
	
	//Redirect to /user/login/select via POST (will preserve request body)
	res.redirect(307, '/user/login/select');
});

//5) Redirect to '/user/login/select', goes to orgs db and compares password
//6a) if fail, redirect to '/user/login?alert=Incorrect password for organization ___'
//6b) If correct, go to users db and get all users under that organization
//7) Page (user/selectuser.pug) shows a dropdown of users '/user/login/select'
router.post('/login/select', async function(req, res){
	
	//This URL can only be accessed via a POST method, because it requires an organization's password.
	
	//get contents of request
	var org_key = req.body.org_key;
	var org_password = req.body.org_password;
	
	//Make sure that form is filled
	if(!org_key || !org_password || org_key == "" || org_password == ""){
		return res.redirect('/user/login?alert=Please select an organization and enter your organization\'s password.');
	}
	
	//If form is filled, then proceed.
	
	//Get org that matches request
	var selectedOrg = await utilities.findOne('orgs', {"org_key": org_key});
	
	//If organization does not exist, send internal error
	if(!selectedOrg) return res.redirect(500, '/user/login');
	
	var passwordHash = selectedOrg.default_password;
	
	//Compare password to correct hash
	var comparison = await bcrypt.compare( org_password, passwordHash );
	
	//If comparison succeeded, then proceed
	if(comparison == true){
		
		//Get list of users that match the organization name
		var users = await utilities.find('users', {"org_key": org_key}, {sort: {name: 1}});
		
		res.render('./user/selectuser', {
			title: `Sign In to ${selectedOrg.nickname}`,
			org: selectedOrg,
			users: users,
			org_password: org_password //Must be passed back to user so they can send org's password back with their request (Avoid dealing with tokens & cookies)
		});
	}
	//If failed, then redirect with alert
	else{
		res.redirect(`/user/login?alert=Incorrect password for organization ${selectedOrg.nickname}`);
	}
})

//8) AJAX POST: '/user/login/withoutpassword' takes "name"
//	a) go to users db and search for name. If user doesn't exist, return JSON {status: 500, alert: "User does not exist in database"}
//	b) get user's role; go to roles db and find access_level of that role
//	c) if access_level > process.env.ACCESS_SCOUTER, then return {status: 200, password_needed: true}
//	d) if access_level == process.env.ACCESS_SCOUTER, then return {status: 307, password_needed: false, redirect_url: '/dashboard'}
//	e) if access_level < process.env.ACCESS_SCOUTER, then return {status: 307, password_needed: false, redirect_url: '/'}
router.post('/login/withoutpassword', async function(req, res){
	
	var userID = req.body.user;
	var org_key = req.body.org_key;
	var org_password = req.body.org_password;
	
	//If we don't have organization info, redirect user to login
	if(!org_key || !org_password){
		return res.status(400).send({
			redirect_url: "/user/login?Sorry, please re-submit your organization login information."
		});
	}
	
	//If no user is selected, send an alert message
	if(!userID || userID == ''){
		return res.status(400).send({
			alert: "Please select a user."
		});
	}
	
	//Get org that matches request
	var selectedOrg = await utilities.findOne('orgs', {"org_key": org_key});
	
	//If organization does not exist, send internal error
	if(!selectedOrg) return res.redirect(500, '/user/login');
	
	var passwordHash = selectedOrg.default_password;
	
	//Compare password to correct hash
	var comparison = await bcrypt.compare( org_password, passwordHash );
	
	//If password isn't correct for some reason, then cry
	if(!comparison){
		return res.status(400).send({
			redirect_url: "/user/login?Sorry, please re-submit your organization login information."
		});
	}
	
	//Find user info that matches selected id
	var user = await utilities.findOne("users", {_id: userID});
	
	//if user doesn't exist in database for some reason, then cry
	if(!user){
		return res.status(500).send({
			alert: "Internal server error: Selected user does not exist in database"
		});
	}
	
	//Get role information from database, and compare to access role for a scouter
	var role_key = user.role_key;
	var userRole = await utilities.findOne("roles", {role_key: role_key});
	
	//If no such role exists, throw an error because there must be one
	if(!userRole) throw new Error(`user.js /login/withoutpassword: No role exists in DB with key ${role_key}`);
	
	if(userRole.access_level > process.env.ACCESS_SCOUTER){
		
		//if access_level > process.env.ACCESS_SCOUTER, then return saying password is required
		res.status(200).send({
			password_needed: true
		});
	} 
	else if(userRole.access_level == process.env.ACCESS_SCOUTER){
		
		//if access_level == process.env.ACCESS_SCOUTER, then proceed with scouter login
		
		//First, check if the user has a password that is default
		if( user.password == "default"){
		
			//If password is default, then we may proceed
			req.logIn(user, function(err){
			
				//If error, then log and return an error
				if(err){ console.error(err); return res.status(500).send({alert: err}) };
				
				//now, return succes with redirect to dashboard
				res.status(200).send({
					password_needed: false,
					redirect_url: '/dashboard'
				});
			});
		}
		else{
			
			//if password is not default, then return with password needed.
			res.status(200).send({
				password_needed: true
			});
		}
	}
	else{
		
		//if access_level < process.env.ACCESS_SCOUTER, then log in user
		req.logIn(user, function(err){
			
			//If error, then log and return an error
			if(err){ console.error(err); return res.status(500).send({alert: err}) };
			
			//Now, return with redirect_url: '/'
			res.status(200).send({
				password_needed: false,
				redirect_url: '/'
			});
		});
	}
});

/*
10) User enters password and clicks Log In
	a) Sends AJAX POST to '/user/login/withpassword' and compares password
	b) Return: 
		{status:500, alert: "User does not exist in database" }
		{status:500, alert: "User does not have a password in database" }
		{status:400, alert" "Incorrect password" }
		{status:200, redirect_url: "/admin" }
*/
router.post('/login/withpassword', async function(req, res){
	
	var userID = req.body.user;
	var userPassword = req.body.password;
	var org_key = req.body.org_key;
	var org_password = req.body.org_password;
	
	//If we don't have organization info, redirect user to login
	if(!org_key || !org_password){
		return res.status(400).send({
			redirect_url: "/user/login?Sorry, please re-submit your organization login information."
		});
	}
	
	//If no user is selected, send an alert message
	if(!userID || userID == ''){
		return res.status(400).send({
			alert: "Please select a user."
		});
	}
	
	//Get org that matches request
	var selectedOrg = await utilities.findOne('orgs', {"org_key": org_key});
	
	//If organization does not exist, send internal error
	if(!selectedOrg) return res.redirect(500, '/user/login');
	
	var orgPasswordHash = selectedOrg.default_password;
	
	//Compare password to correct hash
	var orgComparison = await bcrypt.compare( org_password, orgPasswordHash );
	
	//If password isn't correct for some reason, then cry
	if(!orgComparison){
		return res.status(400).send({
			redirect_url: "/user/login?Sorry, please re-submit your organization login information."
		});
	}
	
	//Find user info that matches selected id
	var user = await utilities.findOne("users", {_id: userID});
	
	//if user doesn't exist in database for some reason, then cry
	if(!user || !user.password){
		return res.status(500).send({
			alert: "Internal server error: Selected user does not exist in database"
		});
	}
	
	//Compare passwords
	var userComparison = await bcrypt.compare( userPassword, user.password );
	
	if(userComparison){
		
		//If comparison succeeded, then log in user
		req.logIn(user, async function(err){
			
			//If error, then log and return an error
			if(err){ console.error(err); return res.status(500).send({alert: err}) };
			
			var userRole = await utilities.findOne("roles", {role_key: user.role_key});
			
			var redirectURL;
			
			//Set redirect url depending on user's access level
			if(userRole.access_level == process.env.ACCESS_GLOBAL_ADMIN) redirectURL = '/admin';
			else if(userRole.access_level == process.env.ACCESS_TEAM_ADMIN) redirectURL = '/admin';
			else if(userRole.access_level == process.env.ACCESS_SCOUTER) redirectURL = '/dashboard';
			else redirectURL = '/';
			
			res.log(`User ${user.name} has logged in with role ${userRole.label} (${userRole.access_level}) and is redirected to ${redirectURL}`);
			
			//otherwise, send success and redirect
			//*** When we add a global_admin page, we should modify this to add a global_admin page redirect
			return res.status(200).send({
				redirect_url: redirectURL
			});
		});
	}
	else{
		//If authentication failed, then send alert
		return res.status(400).send({
			alert: "Incorrect password."
		});
	}
})


/**
 * Simple logout link.
 * @url /user/logout
 * @redirect /
 */
router.get("/logout", function(req, res) {
	
	//Logs out user with message
	req.logout();
	
	//destroy session
	req.session.destroy(function (err) {
		if (err) { return next(err); }
		//Redirect user
		res.redirect('/')
	});
});

module.exports = router;