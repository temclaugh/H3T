H3T
===

## Client

This code makes up the extension that should be installed in the browser. The .crx file
is the compiled extension which can be installed following these instructions http://www.howtogeek.com/120743/how-to-install-extensions-from-outside-the-chrome-web-store/

As for the source files:

####background.js
This file contains the listeners that interact with web requests. In here redirects to the H3T Service Providers are caught. Here is were counters are created and update based on website visit frequency, these counters are also sent to the H3T Service Providers here. Here is also were the HT-Token is saved as a cookie
set
####hashes.js
This file reads the body of the text from the H3T Service Providers. It then sends the HT-Token to background.js to be saved as a cookie.

####icon.png
Just a cool icon for the extension

####manifest.json
Contains the permissions for the extension


## Service (H3T Service Provider)

Hosted for your convenience in heroku at  http://h3t.herokuapp.com/. 
Run locally: >>> node service.js 

#### service.js
A simple web server written in node.js that supports login, registration and token generation.

#### domain.csv
Participating website domain and AES-256 secret key pairs. 

#### users.csv
A simple database keeping track of user ID’s and hashed passwords.

#### logs.csv

## Website (Participating Content Provider)

Hosted for your convenience in heroku at  http://generic-h3t.herokuapp.com/
Run locally: >>> node website.js 

#### website.js
A simple web server written in node.js that supports token decryption, redirection to H3T Service Provider, and content display.