/**
	_moon.MeridiemPicker is a helper kind used by _moon.TimePicker_.
*/
enyo.kind({
	name: "moon.MeridiemPicker",
	kind: "moon.IntegerScrollPicker",
	classes:"moon-date-picker-month",
	min: 0,
	max: 1,
	value: null,
	published: {
		meridiems: ["AM","PM"]
	},
	setupItem: function(inSender, inEvent) {
		var index = inEvent.index;
		this.$.item.setContent(this.meridiems[index]);
	}
});

/**
	_moon.HourPicker is a helper kind used by _moon.TimePicker_.
*/
enyo.kind({
	name: "moon.HourPicker",
	kind: "moon.IntegerScrollPicker",
	classes:"moon-date-picker-month",
	min: 1,
	max: 24,
	zeroToEleven: false,
	value: null,
	setupItem: function(inSender, inEvent) {
		var index = inEvent.index,
			hour;
			
		if (index > 11) {	//current hour reached meridiem(noon)
			index -= 12;
		}

		hour = index + this.min;
		
		if (this.zeroToEleven) {
			hour = ('0' + (hour-1)).slice(-2);  // zero padded 0-11 value
		}
		this.$.item.setContent(hour);
	}
});

/**
	_moon.TimePicker_ is a control that can display--or allow the selection of--a
	time expressed in hours and minutes, with an optional meridiem indicator
	("am" or "pm").

		{kind: "moon.TimePicker", content: "Time", meridiemEnable: true, onChange: "changed"}

	Set the _value_ property to a standard JavaScript Date object to initialize
	the picker, or to change it programmatically at runtime.
*/
enyo.kind({
	name: "moon.TimePicker",
	kind: "moon.DateTimePickerBase",
	published: {
		/**
			When true, the picker uses a 12-hour clock. (This value is ignored when
			_ilib_ is loaded, since the meridiem will be set by the current locale.)
		*/
		meridiemEnable: false
	},
	//*@protected
	iLibFormatType  : "time",
	defaultOrdering : "hma",
	zeroToEleven    : false,
	
	initILib: function() {
		this.inherited(arguments);

		// Set picker format 12 vs 24 hour clock
		var li = new ilib.LocaleInfo();
		var clockPref = li.getClock();
		this.meridiemEnable = (clockPref == '12');
		
		var hourFormatter = new ilib.DateFmt({
		   type: "time",
		   time: "h",
		   clock: clockPref !== "locale" ? clockPref : undefined
		}); 

		switch (hourFormatter.template) {
			case 'KK':
			case 'K' :
			 	// 0-11 hours instead of 1-12
				this.zeroToEleven = true;
				break;
		}
	},
	setupPickers: function(ordering) {
		var orderingArr = ordering.toLowerCase().split("");
		var doneArr = [];
		var o,f,l;
		for(f = 0, l = orderingArr.length; f < l; f++) {
			o = orderingArr[f];
			if (doneArr.indexOf(o) < 0) {
				switch (o){
				case 'h': {
						if (this.meridiemEnable === true) {
							this.createComponent({kind:"moon.HourPicker", name:"hour", zeroToEleven: this.zeroToEleven, min: 1, max:24, value: (this.value.getHours() || 24)});
						} else {
							this.createComponent({kind:"moon.IntegerScrollPicker", name:"hour", classes:"moon-date-picker-month", min:0, max:23, value: this.value.getHours()});
						}
					}
					break;
				case 'm': {
						this.createComponent({kind:"moon.IntegerScrollPicker", name:"minute", classes:"moon-date-picker-month", min:0,max:59, digits: 2, value: this.value.getMinutes()});
					}
					break;
				case 'a': {
						if (this.meridiemEnable === true) {
							this.createComponent({kind:"moon.MeridiemPicker", name:"meridiem", classes:"moon-date-picker-year", value: this.value.getHours() > 12 ? 1 : 0 });
						}
					}
					break;
				default:
					break;
				}
			}
			doneArr.push(o);
		}
		this.inherited(arguments);
	},
	formatValue: function() {
		var dateStr = "";
		if (this._tf) {
			dateStr = this._tf.format(new ilib.Date.GregDate({unixtime: this.value.getTime(), timezone:"UTC"}));
		}
		else {
			if (this.meridiemEnable === true && this.value.getHours() > 12) {
				dateStr += this.value.getHours() - 12;
			} else {
				dateStr += this.value.getHours();
			}
			dateStr += ":" + ("00" + this.value.getMinutes()).slice(-2) + " ";
			dateStr += this.meridiemEnable ? this.$.meridiem.getMeridiems()[this.$.meridiem.getValue()] : "";
		}
		return dateStr;
	},
	updateValue: function(inSender, inEvent) {
		var hour = this.$.hour.getValue();
		var minute = this.$.minute.getValue();

		if (inEvent.originator.kind == "moon.MeridiemPicker") {
			if (hour < 12 && inEvent.originator.value == 1 ) {
				hour += 12;
			} else if ( hour > 12 && hour != 24 && inEvent.originator.value === 0) {
				hour -= 12;
			} else if (hour == 24 && inEvent.originator.value === 1) {
				hour -= 12;
			} else if (hour == 12 && inEvent.originator.value === 0) {
				hour += 12;
			}
			this.$.hour.setScrollTop(inEvent.originator.scrollBounds.clientHeight * (hour-1));
			this.$.hour.setValue(hour);
		}

		this.setValue(new Date(this.value.getFullYear(),
							this.value.getMonth(),
							this.value.getDate(),
							hour, minute,
							this.value.getSeconds(),
							this.value.getMilliseconds()));
	},
	setChildPickers: function(inOld) {
		var hour = this.value.getHours();
		if (this.meridiemEnable === true) {
			this.$.meridiem.setValue(hour > 11 ? 1 : 0);
		}
		if (!hour) {
			hour = 24;
		}
		this.$.hour.setValue(hour);
		this.$.minute.setValue(this.value.getMinutes());

		this.$.currentValue.setContent(this.formatValue());
		this.doChange({name:this.name, value:this.value});
	}
});