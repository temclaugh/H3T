/*
Background.js
Code that examining headers to find redirects to h3t service, handling
them correctly. Also takes care of storing tokens and logs of website visits,
sending them to h3t service provider when needed.
*/



// Parses URLs
var parser = document.createElement('a');

// Stores current Redirect being delt with
var Redirect = {request_id:0, requesting_url: ""}

// Check if the redirect is headed to h3t provider
chrome.webRequest.onBeforeRedirect.addListener(
function(details) {
  // If its redirecting to HT-Provider
  if(details.redirectUrl == "http://h3t.herokuapp.com/redirect"){

    // Lets keep this request in mind
    request = parseInt(details.requestId)
    // If we are already tracking this redirect, do nothin
    if(Redirect.request_id == request) return
    // Store the domain of redirecting website
    Redirect.request_id = request
    parser.href = details.url
    Redirect.requesting_url = parser.hostname.replace("www.","")

  }
}, {urls: ["<all_urls>"]});

/*
Modify Request going to HT-Provider so that they contain information about
requesting website
*/
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {

  request = parseInt(details.requestId)
  // We've been redirected to HT-Provider
  if(Redirect.request_id == request){
    // We should be going to HT-Provider
     if(details.url.indexOf("h3t.herokuapp.com/redirect") > -1){
      parser.href = details.url
      // Add information about requesting site
      url = 'http://h3t.herokuapp.com/token?domain=' + Redirect.requesting_url
      return {redirectUrl:url }
     }
  }
  },
  {urls: ["<all_urls>"]},
  ["blocking"]);
/*
Everytime we send a request, service keeps track of times the site
has been visited
*/
chrome.webRequest.onSendHeaders.addListener(
function(headers){
  // Parse url to domain
  parser.href = headers.url
  var host = parser.hostname.replace("www.","")
  // Get the amount we currently have and increment it
   chrome.storage.local.get(host, function(item){
    var counter= {}
    // We're already keeping track of this service
    if (host in item ){
      counter[host] = item[host]  + 1
    }
    else {
      counter[host]  = 1
    }
    // Set new amount
    chrome.storage.local.set(counter)
    chrome.storage.local.get(host, function(item){
    console.log(item)
    })
  })

},{urls: ["<all_urls>"]});
/*
If cookies have been changed for this service then lets send an update
to the H3T Service Provider and reset the counter
*/
chrome.cookies.onChanged.addListener(function (obj_cookie){
  // Is it an HT-Token cookie?
  if(obj_cookie.cookie.name == "HT-Token"){
    var url = ""
    // Deal with (some) urls that start with .
    if(obj_cookie.cookie.domain[0] == "." ){
      url =  obj_cookie.cookie.domain.substring(1, obj_cookie.cookie.domain.length);
    }
    else{
      url = obj_cookie.cookie.domain
    }
    // Lets get the counter for that cookie
    chrome.storage.local.get(url, function(item){
     // Return if there is no information for that website
      if(!item) return
      var req = new XMLHttpRequest();
      // Sends message with counter H3T Service provider via POST
      req.open("POST","http://h3t.herokuapp.com/log",true);
      var params = "domain="+ url + "&count="+item[url].toString();
      //Send the proper header information along with the request
      req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      req.send(params)




    })
     // Reset Cookie
    var updated_counter = {}
    updated_counter[url] = 0
    chrome.storage.local.set(updated_counter)
  }
});

// Set cookies that we receive from the token website
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
});