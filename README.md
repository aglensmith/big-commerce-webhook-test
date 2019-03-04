## Examples of "Well-Documented" APIs and Docs

[Shipstation API Docs](https://shipstation.docs.apiary.io/#reference/shipments/list-shipments/list-shipments-w/o-parameters)

* Live API Testing Console
* Examples in multiple languages
* Complete field descriptions for each resource, organized in tables with name, data type, and description
* Good use of in-line snippets and code blocks
* Differences between available APIs explained
* Authentication instructions easy to find
* Eye-pleasing and easy to read color pallet, font-face, and text formatting
* Rate limit and DateTime format explained
* Good use of fixed left column for easy navigation
* Styling consistent across all pages
* Performant page load

[Box API Docs](https://developer.box.com/docs/work-with-metadata)

* Good use of fixed left column for easy navigation
* Authentication instructions and examples easy to find
* Multiple quickstart guides depending on usage
* Color coded informational blocks
* Live API Testing Console
* Examples in multiple languages -- Can tab between them easily; very nice
* Complete field descriptions for each resource, organized in tables with name, data type, and description
* Good use of in-line snippets and code blocks
* Differences between available APIs explained
* Authentication instructions easy to find
* Eye-pleasing and easy to read color pallet, font-face, and text formatting
* Rate limit and DateTime format explained
* Good use of fixed left column for easy navigation
* Styling consistent across all pages
* Performant page load

[Unity User Manual](https://docs.unity3d.com/ScriptReference/Transform.html) -- Probably the best documentation, ever.

* Every name space and class has its own page that includes a well-written, concise description, code block example, and an exhaustive list of properties and members
* Objects in clode blocks are hyperlinked so readers can click-through to read the documentation on that specific class or method.
* Star rating system for articles
* Option for readers to leave feedback and report problems with articles
* Eye-pleasing and easy to read color pallet, font-face, and text formatting
* Styling consistent across all pages
* Good use of fixed left column for easy navigation
* Sections / Categories in left column are collapsible
* Articles, section and categories are well organized

**Honorable Mentions:**

* [Zendesks API docs](https://developer.zendesk.com/rest_api/docs/help_center/articles)
* [Jekyll Docs](https://jekyllrb.com/docs/posts/)
* [Mkdocs](https://www.mkdocs.org/#getting-started)
* [Microsoft docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/classes#declaring-classes)
* [Heroku Dev Center](https://devcenter.heroku.com/categories/heroku-architecture)
* [Digital Ocean Tutorials](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-18-04)
* [Bambora API Docs](https://developer.bambora.com/europe/checkout/api-reference/checkout)

## Improvements: NodeJS

**Original:**

>NodeJS ecosystem is very big and it is still growing day by day. It is an asynchronous event driven environment that uses google's v8 engine to run javascript. V8 is the same engine used in google chrome to run JavaScript.

>As it is asynchronous in nature, you should be able to leverage or handle it efficiently. So I highly recommend that once you finish this guide, you read about callback hell and promises.

>This article will focus on covering the tools that will help you as a beginner to better understand the environment. Hovever, if you're already a NodeJS developer then you might already know these.

>The official docs explains NodeJS very efficiently in a concise manner. If you're interested then give it 5 minutes of your time. This article will focus on covering the tools that will help you as a beginner to better understand the environment. Hovever,

**Improved:**

NodeJS is an asynchronous, event driven environment that uses google's v8 engine to run javascript. Node's asynchronous architecture, helpful community, and vast number of third-party packages reduces development time and helps get projects of the ground quickly. 

This article will focus on discussing the tools and techniques necessary for beginners to get started with NodeJS. If you're already an experienced developer, feel free to read along (you might learn some new tips and tricks); however, if would like more in-depth information, see: [Node's Official Documentation](https://nodejs.org/en/docs/). 

## Improvements: Data Types

**Original:**

>The Data Type of a variable plays an important role in statistics which must be understood, to correctly apply statistical measurements to your data. In statistics, the term "Measurement Scale" may be used as well.”

**Improved:**

In order to ensure accurate and useful analysis of data, the correct statisical data type (also known as Measurement Scale) must be identified and applied to each variable or metric. 

## Webhook Tutorial

See: [big-commerce-webhook-test](/big-commerce-webhook-test)

## Recommendations for Improving Webhook Documentation

I would mention somewhere that, before the node app is started up, its expected for ngrok to show a 404/502 response when browsing to the ngrok URL. Seems kinda obvious in hindsight, but might not be obvious to someone setting it up for the first time. Something like "Now that you've started ngrok, go ahead and browse to the specified URL. You should get a 404 response -- this okay because we haven't started the app yet..."  

## Writing Samples

* [Publishing an API APP](https://support.americommerce.com/hc/en-us/articles/360004253313-Publishing-an-API-App) -- Written for AmeriCommerce. Prior to this article's publication, there wasn't a public-facing document for developer's to reference; I wrote it from the ground-up.
* [Shipping Overview](https://support.americommerce.com/hc/en-us/articles/220217788-Shipping-Overview)- Written for AmeriCommerce. Prior to this, there were lots of shipping articles about specific topics, but nothing that tied them all together and gave a high-level explanation the shipping system; I wrote this article for that purpose.
* [Adding a Custom Checkout Message](https://support.americommerce.com/hc/en-us/articles/115003487134-Adding-a-Custom-Checkout-Message) -- I wrote this specifically to help one client; however, turned out to be handy for others as well. 
* [Twitter API Authentication Using C# and .NET's HttpClient](http://www.aglensmith.com/twitter-api-authentication/) -- a blog post I made while working on a learning project. 
* [beaumont.js: Calling All SETX Coders](http://www.aglensmith.com/calling-all-setx-coders/) -- Another blog post about a local JS group. 