// Parses URLs
var parser = document.createElement('a');
var Redirect = {request_id:0, requesting_url: ""}
// Keep information about redirects to HT-Service Prodiver
chrome.webRequest.onBeforeRedirect.addListener(
function(details) {
	// If its redirecting to HT-Provider
	if(details.redirectUrl == "https://www.google.com/?gws_rd=ssl"){
		request = parseInt(details.requestId)
		// If we are already tracking this redirect, do nothin
		if(Redirect.request_id == request) return
		else {
			Redirect.request_id = request
			parser.href = details.url
			Redirect.requesting_url = parser.hostname


		}
	}
}, {urls: ["<all_urls>"]});

// Modify Request going to HT-Provider
chrome.webRequest.onBeforeRequest.addListener(
  function(details) { console.log("onBeforeRequest");
  // We've been redirected to HT-Provider
  request = parseInt(details.requestId)
  if(Redirect.request_id == request){
  	// We should be going to HT-Provider
  	 if(details.url.indexOf("google.com/?gws_rd=ssl") > -1){
  	 	console.log(Redirect)
  		url = 'http://h3t.herokuapp.com/token?domain=' + Redirect.requesting_url.replace("www.","")
  		return {redirectUrl:url }
  	 }
  }
  },
  {urls: ["<all_urls>"]},
  ["blocking"]);

// chrome.webRequest.onBeforeSendHeaders.addListener(
//   function(details) {
//     for (var i = 0; i < details.requestHeaders.length; ++i) {
//       if (details.requestHeaders[i].name === 'User-Agent') {
//         // details.requestHeaders[i].value = "HT"
//         // details.requestHeaders.splice(i, 1);
//         break;
//       }
//     }
//     if(details.url.indexOf("www.h3t.com") > -1){
//     	console.log("landed")
//     	details.url = 'http://www.reddit.com'
//     	//chrome.tabs.create({url:'http://www.google.com'}, function(tab){})
//     	console.log("foo")
//     }

//     return { requestHeaders: details.requestHeaders};
//   },
//   {urls: ["<all_urls>"]},
//   ["blocking", "requestHeaders"]);
// chrome.webRequest.onResponseStarted.addListener(
// 	function(response){
// 		//console.log(response)
// 	}, {urls: ["<all_urls>"]});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	if (sender.tab){
  		console.log("Received message from "+sender.tab.url)
  	}
  if(request.cookie){
		chrome.cookies.set(request.cookie)
		var worked = false
		sendResponse({cookie_status: "success"})
	}
		// chrome.cookies.get({url:request.cookie.url,name:request.cookie.name}, function(check_cookie){

		// 	if(check_cookie.name == request.cookie.name )	{
		// 		worked = true
		// 		sendResponse({cookie_status: "success"})
		// 	}
		// 	else {
		// 		sendResponse({cookie_status: "success"})
		// 	}
		// })
		// if (worked) sendResponse({cookie_status: "success"})
		// }


  });