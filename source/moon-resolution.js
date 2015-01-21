(function(enyo, scope) {
	/**
	* Instantiates and loads [iLib]{@link ilib} and its resources.
	*
	* @private
	*/
	scope.moon = scope.moon || {};

	var baseScreenType = 'fhd';

	/**
	* A hash-store of all of our detectable screen types in incrementing sizes.
	*
	* @public
	*/
	scope.moon.screenTypes = [
		{name: 'hd',    pxPerRem: 8,  height: 720,  width: 1280},
		{name: 'fhd',   pxPerRem: 12, height: 1080, width: 1920},
		{name: 'uhd',   pxPerRem: 24, height: 2160, width: 3840}
	];

	var getScreenTypeObject = function (name) {
		var types = scope.moon.screenTypes;
		return types.filter(function (elem) {
			return (name == elem.name);
		})[0];
	};

	/**
	* Fetches the best-matching screen type name for the current screen size. The "best" screen type
	* is determined by the screen type name that is the closest to the screen resolution without
	* going over. ("The Price is Right" style.)
	*
	* @param {Object} [rez] - Optional measurement scheme. Must have "height" and "width" properties.
	* @returns {String} Screen type, like "fhd", "uhd", etc.
	* @name moon.$L
	* @public
	*/
	scope.moon.getScreenType = function (rez) {
		rez = rez || {
			height: scope.innerHeight,
			width: scope.innerWidth
		};
		var i,
			types = this.screenTypes,
			bestMatch = types[types.length - 1].name;

		// loop thorugh resolutions
		for (i = types.length - 1; i >= 0; i--) {
			// find the one that matches our current size or is smaller. default to the first.
			if (rez.width <= types[i].width) {
				bestMatch = types[i].name;
			}
		}
		// return the name of the resolution if we find one.
		return bestMatch;
	};

	scope.moon.updateScreenTypeOnBody = function (type) {
		type = type || this.getScreenType();
		if (type) {
			enyo.dom.addBodyClass('moon-res-' + type.toLowerCase());
			return type;
		}
	};

	scope.moon.getRemRatio = function (type) {
		type = type || this.getScreenType();
		if (type) {
			return this.getUnitToPixelFactors(type) / baseScreenType;
		}
		return 1;
	};

	scope.moon.getUnitToPixelFactors = function (type) {
		type = type || this.getScreenType();
		if (type) {
			return getScreenTypeObject(type).pxPerRem;
		}
		return 1;
	};

	scope.moon.updateScreenTypeOnBody();
	enyo.dom.unitToPixelFactors.rem = scope.moon.getUnitToPixelFactors();

})(enyo, this);
