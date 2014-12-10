

// Are we at the site for tokens?
if(window.location.href.indexOf("/token")){
	if (document.body.innerText == "{}"){
		no_token()
	}
	else {
		var token = JSON.parse(document.body.innerText)
		// Check again that we have a token
		if(Object.keys(token).length == 0) no_token()

		if(token.domain && token.payload){
			// Expiration
			var milliseconds = (new Date).getTime() + 100;

			chrome.runtime.sendMessage({cookie:{url:"http://www."+token.domain, name:'HT-Token', value: token.payload ,expirationDate: milliseconds, domain:token.domain, httpOnly:false }}, function(response) {
 					 console.log(response)
 					 if (response.cookie_status == "success"){
 					 	window.location = 'http://'+token.domain
 					 }
					});
		}
	}

}


function no_token(){
	//Inform user
	document.body.innerHTML +="<h1>You are either not logged in or do not have access to this site</h1>"
	// Redirect user to main page
	window.setTimeout(function(){window.location = window.location.href.host;}, 3000);

}



