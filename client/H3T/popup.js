
// function showHeaders(headers){
//    for (var i = 0; i < headers.length; ++i) {
//     document.body.appendChild(headers[i])
//    }
// }
      // chrome.webRequest.onBeforeSendHeaders.addListener(
      //   function(details) {
      //     for (var i = 0; i < details.requestHeaders.length; ++i) {
      //       if (details.requestHeaders[i].name === 'User-Agent') {
      //         details.requestHeaders.splice(i, 1);
      //         break;
      //       }
      //     }
      //     return {requestHeaders: details.requestHeaders};
      //   },
      //   {urls: ["<all_urls>"]},
 //      //   ["blocking", "requestHeaders"]);
 // chrome.webRequest.onBeforeSendHeaders.addListener(
 //        function(details) {
 //          for (var i = 0; i < details.requestHeaders.length; ++i) {
 //            if (details.requestHeaders[i].name === 'User-Agent') {
 //              details.requestHeaders.splice(i, 1);
 //              break;
 //            }
 //          }
 //          return {requestHeaders: details.requestHeaders};
 //        },
 //        {urls: ["<all_urls>"]},
 //        ["blocking", "requestHeaders"]);






// chrome.webRequest.onBeforeRedirect.addListener(
//       function(details) {
//         for (var i = 0; i < details.requestHeaders.length; ++i) {
//           // if (details.requestHeaders[i].name === 'location') {
//           //   var url = details.requestHeaders[i].value
//           //   var index = url.indexOf("www.ht-service-provider")
//           //   if(index == -1){
//           //     // Not an HT Redirect
//           //     return {requestHeaders: details.requestHeaders};
//           //   }
//           //   else{
//           //     website = url.substring(index, url.length);
//           //     token = request_ht_token(website, KEY)
//           //   }
//           // }
//         }

//         chrome.cookies.set({url: website, name: token.name, value: token.value}, function( Cookie cookie) {
//           if (cookie == null){
//             ht_error()
//           }
//         };)
//         return {requestHeaders: details.requestHeaders};
//       },
//       {urls: ["<all_urls>"]},
//       ["blocking", "requestHeaders"]);


