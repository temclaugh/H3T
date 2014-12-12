/*
Hashes.js
Code that handles body of response from H3T Server. Collecting
the token, sending it to be stored as well as redirecting the user

*/

// Are we at the site for tokens?
if(window.location.href.indexOf("/token") > -1){
	if (document.body.innerText == "{}"){
		no_token()
	}
	else {
		var token
		// Try to force into an object
		try {
			 token = JSON.parse(document.body.innerText)
		}
		catch(err) {
    	console.log(err)
		}

		// Check again that we have a token
		if(Object.keys(token).length == 0) no_token()
		// We have a token that has a domain and a mesasge
		if(token.domain && token.message){
			// Send message to background to set coookies
			chrome.runtime.sendMessage({cookie:{url:"http://www."+token.domain, name:'HT-Token', value: token.message ,expirationDate: token.expiration, domain:token.domain, httpOnly:false }}, function(response) {

					// If everything worked redirect
 					 if (response.cookie_status == "success"){
 					 	window.location = 'http://'+ token.domain +"/content"
 					 }
					});
		}
	}

}
// Deal with server not returning a Token
function no_token(){
	//Inform user
	document.body.innerHTML +="<h1>You are either not logged in or do not have access to this site</h1>"
	// Redirect user to main page
	window.setTimeout(function(){
		window.location = "http://h3t.herokuapp.com/login";}, 2000);

}



