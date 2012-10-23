var Options = undefined;

var picture = {
	url			: undefined,
	caption : "",
	tags		: "",
	clickThroughUrl : "",
	obj			: undefined,
	reset		: function() {
		picture.url					= undefined;
		picture.caption 		= "";
		picture.tags 				= "";
		clickThroughUrl : "",
		picture.obj 				= undefined;
	},
	setInfos: function(e) {
		var img = e.target;		
		if(img.nodeName.toLowerCase() == "img") {
			picture.caption = "";
			picture.obj			= img;
		}
	}
};

/* Update current picture */
document.addEventListener("mousedown", picture.setInfos, false);

/* Listen for command from background */
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if(request.name == 'parseAndSend') {
			picture.url = request.url;
			parseAndSend();
		}
		else if(request.name == 'optionsHasChanged') {
			updateOptions();
		}
		
		// Response with an empty object
		sendResponse({});
});

/* Copy options to contentscript */
function updateOptions() {
	chrome.extension.sendRequest(
		{
			name		: "getOptions",
		},
		function(o) {
			Options = o;
		}
	);	
}

/* Send image to tumblr through background */
function parseAndSend() {
	/* Detect malformed image url */
	if(picture.url == undefined) {
		alert("Huhu bad thing happends :(\nThe image-url is not detected correctly");
		return;
	}
	
	/* Take selection as caption if available */
	var selection = window.getSelection().toString().replace(/(\n|\r|\s)+$/, '');
	picture.caption = selection ? selection : picture.caption;
	
	/* Confirm caption */
	if(picture.caption || Options.AskForCaption) {
		/* Use title of the page as caption IF caption is empty AND askforcaption is enabled */
		if(picture.caption == "" && Options.AskForCaption) {
			picture.caption = document.title;
		}
		
		var caption = prompt("Caption:",picture.caption);
		if(caption != null) {
			picture.caption = caption;
		}
		else {
			picture.caption = "";
		}
	}
	
	/* Add Host/Source to caption */
	var host = (window.location.href.match(/:\/\/(.[^/]+)/)[1]).replace('www.','');
	host = "<a href='http://"+ host +"'>@"+ host +"</a>";
	var source = window.location.href;
	source = "<a href='http://"+ source +"'>@source</a>";
	
	// Replace @host with real host
	picture.caption = picture.caption.replace(/@host/ig, host);
	// Replace @source with real source
	picture.caption = picture.caption.replace(/@source/ig, source);
	if(Options.AddHostToCaption) {
		picture.caption = picture.caption + " " + host;
	}
	
	/* Ask for tags */
	if(Options.AskForTag) {
		var tags = prompt("Tags (comma,separated):");
		if(tags != null) {
			picture.tags = tags;
		}
	}

	/* Click through */
	if(Options.ClickThroughUrl) {
		picture.clickThroughUrl = window.location.href;
	}
	
	/* Dimm image */
	$(picture.obj).fadeTo("slow",0.3);
	
	/* Send image to tumblr through background */
	chrome.extension.sendRequest(
		{
			name		: "send",
			url			: picture.url,
			caption	: picture.caption,
			tags		: picture.tags,
			clickThroughUrl : picture.clickThroughUrl
		},
		function(response) {
			if(response.name == "post_error") {
				alert(response.status);
			}
			$(picture.obj).fadeTo("fast",1.0);
			picture.reset();
		}
	);
}

// Get options onload
updateOptions();