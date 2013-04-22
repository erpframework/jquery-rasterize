(function($) {
	$.fn.rasterize = function(options) {
		var history = new Object();
		var chained = function(options) {
			return rasterize(this, options, history);
		};
		return $.extend(rasterize(this, options, history), {rasterize: chained});
	}

	var rasterize = function(collection, options, history) {
		var icon = options.to === 'favicon';
		options = $.extend({}, {
			attr: icon ? 'href' : 'src',
			dom: icon ? 'reinsert' : null,
			hd: false,
			height: null,
			preload: false,
			to: null,
			type: null,
			width: null
		}, options);
		if (icon) {
			options.to = getIcons();
			if (options.to.length === 0) {
				options.to = $('<link rel="icon" />').appendTo('head');
			}
		}
		var key = cacheKey(options);
		history[key] || (history[key] = {inProgress: []});
		var data = history[key];
		data.inProgress.push(options);
		if (data.dataUrl) {
			setUrls(data);
		} else if (data.inProgress.length === 1) {
			startRendering(collection, options, data);
		}
		return collection;
	};

	var cacheKey = function(options) {
		return [options.width, options.height, options.type, options.quality].join();
	};

	var startRendering = function(collection, options, data) {
		var attr = { width: 1, height: 1 };
		var html = new Array();
		collection.each(function() {
			var element = this === document ? $(':root') : $(this);
			html.push(element.html());
			var rect = this.getBoundingClientRect ? this.getBoundingClientRect() : { width: 0, height: 0 };
			var width = rect.width;
			var height = rect.height;
			width === 0 && (width = element.width());
			height === 0 && (height = element.height());
			attr = { width: Math.max(attr.width, width), height: Math.max(attr.height, height) };
		});

		var drawNextLayer = function() {
			if (html.length) {
				var layer = html.shift();
				if (typeof rasterizeHTML !== 'undefined') {
					rasterizeHTML.drawHTML(layer, canvas, {}, drawNextLayer);
				}
			} else {
				data.dataUrl = canvas.toDataURL(options.type, options.quality);
				setUrls(data);
				delete canvas;
			}
		};
		var canvas = $('<canvas/>').attr(attr).get(0);
		drawNextLayer();
		return collection;
	};

	var icons = 'head link[rel~=icon]';
	var getIcons = function() {
		return $(icons);
	};

	var setUrls = function(data) {
		while(data.inProgress.length) {
			loadImageAndSetUrl(data.dataUrl, data.inProgress.shift());
		}
	}

	var loadImageAndSetUrl = function(dataUrl, options) {
		if (!options.preload) {
			return setUrl(dataUrl, options);
		}
		var preload = new Image();
		preload.onload = function() {
			setUrl(preload.src, options);
		};
		preload.src = dataUrl;
	};

	var setUrl = function(dataUrl, options) {
		$(options.to).attr(options.attr, dataUrl).each(function() {
			if (options.dom === 'reinsert') {
				this.parentNode.insertBefore(this, this.nextSibling);
			}
		});
	};
})(jQuery);