require('moonstone');

var
	kind = require('enyo/kind'),
	utils = require('enyo/utils')
	EnyoAudio = require('enyo/Audio'),
	Signals = require('enyo/Signals'),
	Collection = require('enyo/Collection');


var
	Drawer = require('moonstone/Drawer'),
	IconButton = require('moonstone/IconButton'),
	Image = require('moonstone/Image'),
	Slider = require('moonstone/Slider');

/**
* Fires when an audio track is added to the list
*
* @event moon.AudioPlayback#onAddAudio
* @type {Object}
* @property {Object} tracks - contains a reference to the collection of tracks
* @public
*/

/**
* Fires when an audio list item is to be removed. The list event data is passed through.
* TODO: When fixed with right list component be sure to link to event data.
*
* @event moon.AudioPlayback#onRemove
* @type {Object}
* @public
*/

/**
* `moon.AudioPlayback` is meant to be used with {@link moon.Drawers}.
* This extends a {@link moon.Drawer} by adding an audio playback control
* and playlist for the imported audio.
*
* ```
* {kind:'moon.Drawers', drawers:[
* 	{
* 		kind: 'moon.AudioPlayback',
* 	}
* ],
* components: [
* 	{content: 'Page Content'}
* ]}
* ```
*
* @class moon.AudioPlayback
* @extends moon.Drawer
* @ui
* @public
*/

module.exports = kind(
	/** @lends moon.AudioPlayback.prototype */ {

	/**
	* @private
	*/
	name: 'moon.AudioPlayback',

	/**
	* @private
	*/
	kind: Drawer,

	/**
	* @private
	*/
	classes: 'moon-audio-playback',

	/**
	* @private
	*/
	open: false,

	/**
	* @private
	*/
	controlsOpen: false,

	/**
	* @private
	*/
	audioTracks: [],

	/**
	* @private
	*/
	index: -1,

	/**
	* @private
	*/
	controlDrawerComponents:[],

	/**
	* @private
	*/
	playheadJob: null,

	/**
	* @private
	*/
	playOrder: [],

	/**
	* @protected
	*/
	playheadUpdateInterval: 200,

	/**
	* @private
	*/
	previewMode: false,

	/**
	* @private
	* @lends moon.AudioPlayback.prototype
	*/
	published: {

		/**
		* When 'none', no repeat after play audio.
		* Set 'one' for repeat one audio, 'all' for repeat all audio.
		*
		* @type {String}
		* @default none
		* @public
		*/
		repeat: 'none',

		/**
		* When 'true', play audio in shuffle order.
		* When 'false', play audio in queue order.
		*
		* @type {String}
		* @default none
		* @public
		*/
		shuffle: false,

		/**
		* When 'false', audio player doesn't respond to remote controller
		*
		* @type {Boolean}
		* @default true
		* @public
		*/
		handleRemoteControlKey: true,

		/**
		* After playPrevThreshold time, play from start
		* 
		* @type {Number}
		* @default 5
		* @public
		*/
		playPrevThreshold: 5,

		/**
		* When 'true', auto play audio after turn shuffle on.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		autoPlayOnShuffle: true,

		/**
		* When 'true', update current time while drag slider
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		liveMode: false
	},

	/**
	* @private
	*/
	audioComponents: [
		{name: 'audio', kind: EnyoAudio, onEnded: 'audioEnd', onError: 'audioError'},
		{kind: Signals, onkeyup: 'remoteKeyHandler', onSpotlightModeChanged: 'spotlightModeChanged'},
		{rtl: false, classes: 'moon-audio-playback-controls', spotlight: 'container', components: [
			{rtl: false, classes: 'moon-audio-playback-top', components: [
				{name: 'trackIcon', kind: Image, sizing: 'cover', classes: 'moon-audio-track-icon'},
				{name: 'trackInfo', classes: 'moon-audio-track-info', components: [
					{name: 'trackName', content: 'Track Name', classes: 'moon-audio-playback-track'},
					{name: 'artistName', content: 'Artist Name', classes: 'moon-audio-playback-artist'}
				]},
				{name: 'commandControls', publish: true, classes: 'moon-audio-control-buttons', components: [
					{name: 'rewind', kind: IconButton, icon: 'backward', small: false, command: 'rewind', classes: 'moon-audio-icon-button left', ontap: 'commandHandler'},
					{name: 'playpause', kind: IconButton, icon: 'play', small: false, command: 'playpause', name: 'btnPlay', classes: 'moon-audio-icon-button left', ontap: 'commandHandler'},
					{name: 'fastforward', kind: IconButton, icon: 'forward', small: false, command: 'fastforward', classes: 'moon-audio-icon-button left', ontap: 'commandHandler'}
				]},
				{name: 'moreControls', publish: true, classes: 'moon-audio-more-buttons'}
			]},
			{rtl: false, classes: 'moon-audio-playback-bottom', components: [
				{kind: Slider, enableJumpIncrement: false, spotlight: false, name: 'slider', classes: 'moon-audio-slider', 
				knobClasses: 'moon-audio-slider-knob', bgBarClasses: 'moon-audio-slider-bg-bar', 
				barClasses: 'moon-audio-slider-bar-bar', tapAreaClasses: 'moon-audio-slider-taparea',
				rtl: false, noPopup: true, lockBar: true, onChanging: 'sliderChanging', onAnimateFinish: 'sliderChanging',
				onmove: 'preview', onenter: 'enterTapArea', onleave: 'leaveTapArea'},
				{name: 'timePlayed', classes: 'moon-audio-play-time left', content: '0:00'},
				{name: 'timeRemaining', classes: 'moon-audio-play-time right', content: '0:00'}
			]}
		]}
	],

	/**
	* @private
	*/
	bindings: [
		// Facade open property of client to playback
		{from: '$.client.open', to: 'queueOpen'}
	],

	/**
	* @private
	*/
	create: function () {
		this.inherited(arguments);
		this.$.controlDrawer.createComponents(this.audioComponents, {owner: this});
		if (this.moreComponents) {
			var owner = this.hasOwnProperty('moreComponents') ? this.getInstanceOwner() : this;
			this.$.moreControls.createComponents(this.moreComponents, {owner: owner});
		}
	},

	/** preview mode */

	/**
	* @private
	*/
	enterTapArea: function (sender, event) {
		if (event.originator.name == 'tapArea') {
			this.startPreview();	
		}
	},

	/**
	* @private
	*/
	leaveTapArea: function (sender, event) {
		if (event.originator.name == 'tapArea') {
			this.endPreview();
		}
	},

	/**
	* @private
	*/
	startPreview: function () {
		this.previewMode = true;
		if (!this.$.slider.disabled) {
			this.$.slider.addClass('visible');
		}
	},
	
	/**
	* @private
	*/
	endPreview: function () {
		this.previewMode = false;
		this.$.slider.removeClass('visible');
		this.updatePlayhead();
	},

	/**
	* @private
	*/
	preview: function (sender, event) {
		if (!this.$.slider.disabled) {
			if (!this.previewMode) {
				this.startPreview();
			}
			this.previewPos = this.$.slider.calcKnobPosition(event);
			this.updatePlayhead();
		}
	},

	/**
	* Force end preview mode when user press 5way while dragging
	* @private
	*/
	spotlightModeChanged: function (sender, event) {
		if (this.dragging && !event.pointerMode) {
			this.endPreview();
			this.updatePlayhead();
		}
	},

	/** Public APIs for playback controls */

	/**
	* @public
	*/
	toggleFullDrawer: function () {
		this.$.client.setOpen(!this.$.client.getOpen());
	},

	/**
	* Toggle repeate: none -> one -> all -> none -> ... 
	* @public
	*/
	toggleRepeat: function () {
		if (this.repeat == 'none') this.set('repeat', 'one');
		else if (this.repeat == 'one') this.set('repeat', 'all');
		else this.set('repeat', 'none');
	},

	/**
	* Toggle shuffle feature: on <-> off
	* When shuffle is true, re-shuffle play order.
	* When autoPlayOnShuffle is true, auto play audio after shuffle.
	* @public
	*/
	toggleShuffle: function () {
		this.set('shuffle', !this.shuffle);
		if (this.audioTracks.length == 0 /*|| !this.shuffle */) {
			return;
		}
		
		this.shuffleList();

		if (this.autoPlayOnShuffle) {
			// Play from index 0
			this.index = 0;
			this.updateTrackIndex(this.shuffle ? this.playOrder[this.index] : this.index);
			this.play();
			// Force play from start even when the first shuffled audio is the same as current
			this.$.audio.seekTo(0);
		}
	},

	/**
	* Get shuffled play order array.
	*
	* @protected
	*/
	shuffleList: function () {
		var length = this.audioTracks.length,
			currentIndex = length,
			temporaryValue,
			randomIndex;

		this.playOrder = [];
		for (var i=0; i<length; i++) {
			this.playOrder.push(i);
		}

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = this.playOrder[currentIndex];
			this.playOrder[currentIndex] = this.playOrder[randomIndex];
			this.playOrder[randomIndex] = temporaryValue;
		}
	},

	/**
	* @private
	*/
	endPlayheadJob: function () {
		clearInterval(this.playheadJob);
		this.playheadJob = null;
	},

	/**
	* Handling repeat on audioEnd and playNext function
	* @protected
	*/
	audioEnd: function () {
		if ((this.index === (this.audioTracks.length-1)) && (this.repeat == 'none')) {
			this.stop();
		} else {
			this.playNext();
		}
	},

	/**
	* Virtual function to handle audioError
	* @protected
	*/
	audioError: function(sender, event) {
		// Error handling here
	},

	/**
	* @private
	*/
	updateTrackCount: function () {
		var l = this.audioTracks.length;
		if (l === 1) {
			this.index = 0;
			this.updateTrackIndex(this.index);
		}
	},

	/**
	* @private
	*/
	updateTrackIndex: function (index) {
		var a = this.audioTracks[index];
		this.$.trackName.setContent(a.trackName);
		this.$.artistName.setContent(a.artistName);
		this.$.audio.setSrc(a.src);
		this.updatePlayTime('0:00', '0:00');
		this.$.trackIcon.setSrc(a.albumArt);
	},

	/**
	* @private
	*/
	updatePlayhead: function () {
		var duration = this.$.audio.getDuration();
		var totalTime = isNaN(duration) ? 0 : duration;
		var currentTime = this.$.audio.getCurrentTime();
		var bufferTime = this.getBufferedTime();
		var playheadPos = (currentTime * 100) / totalTime;
		var bufferheadPos = (bufferTime * 100) / totalTime;
		this.$.slider.setProgress(playheadPos);
		this.$.slider.setBgProgress(bufferheadPos);
		// Calculate currentTime from cursor position in previewMode
		if (this.previewMode) {
			playheadPos = this.previewPos;
			currentTime = (playheadPos / 100) * totalTime;
		}
		this.updatePlayTime(this.toReadableTime(currentTime), this.toReadableTime(totalTime));
		this.$.slider.updateKnobPosition(playheadPos);

	},

	/**
	* @private
	*/
	getBufferedTime: function() {
		var bufferData = this.$.audio.getBuffered(),
			numberOfBuffers = bufferData.length,
			highestBufferPoint = 0,
			duration = this.$.audio.getDuration() || 0,
			endPoint = 0,
			i
		;

		if (duration === 0 || isNaN(duration)) {
			return 0;
		}

		// Find furthest along buffer end point and use that (only supporting one buffer range for now)
		for (i = 0; i < numberOfBuffers; i++) {
			endPoint = bufferData.end(i);
			highestBufferPoint = (endPoint > highestBufferPoint) ? endPoint : highestBufferPoint;
		}
		return highestBufferPoint;
	},

	/**
	* @private
	*/
	updatePlayTime: function (start, end) {
		this.$.timePlayed.setContent(start);
		this.$.timeRemaining.setContent(end);
	},

	/**
	* @private
	*/
	sliderChanging: function (sender, event) {
		if (!this.liveMode && event.type == 'onChanging') return;
		var totalTime = this.$.audio.getDuration();
		var currentTime = (totalTime / 100) * event.value;
		this.updatePlayTime(this.toReadableTime(currentTime), this.toReadableTime(totalTime));
		this.$.audio.seekTo(currentTime);
	},

	/**
	* Convert time to readable format
	*
	* @protected
	*/
	toReadableTime: function (sec) {
		var minutes = Math.floor(sec / 60).toString();
		var seconds = Math.floor(sec - minutes * 60).toString();
		if (seconds < 10) {
			seconds = '0' + seconds;
		} else if (seconds.length === 1) {
			seconds += '0';
		}
		return minutes + ':' + seconds;
	},

	/**
	* Decide behavior of playback command
	*
	* @protected
	*/
	commandHandler: function (sender, event) {
		switch (sender.command) {
			case 'play':
				this.play();
				break;
			case 'pause' :
				this.pause();
				break;
			case 'stop':
				this.stop();
				break;
			case 'playpause' :
				this.togglePlay();
				break;
			case 'rewind' :
				this.playPrevious();
				break;
			case 'fastforward' :
				this.playNext();
				break;
			default:
				// Command not found
				break;
		}
	},

	/**
	* pauses audio if is playing, and plays it if it is paused
	*
	* @public
	*/
	togglePlay: function () {
		if (this.$.audio.getPaused() && this.audioTracks.length < 0) {
			this.play();
		} else {
			this.pause();
		}
	},

	/**
	* plays audio
	*
	* @public
	*/
	play: function () {
		this.$.audio.play();
		if (this.playheadJob === null) {
			this.playheadJob = setInterval(this.bindSafely('updatePlayhead'), this.playheadUpdateInterval);
		}
		// this.$.btnPlay.applyStyle('background-image', 'url(assets/icon-pause-btn.png)');
		this.$.btnPlay.setIcon('pause');
	},

	/**
	* pauses audio
	*
	* @public
	*/
	pause: function () {
		this.$.audio.pause();
		this.endPlayheadJob();
		// this.$.btnPlay.applyStyle('background-image', 'url(assets/icon-play-btn.png)');
		this.$.btnPlay.setIcon('play');
	},

	/**
	* stop audio
	*
	* @public
	*/
	stop: function () {
		this.$.audio.pause();
		this.$.audio.seekTo(0);
		this.endPlayheadJob();
		this.updatePlayhead();
		// this.$.btnPlay.applyStyle('background-image', 'url(assets/icon-play-btn.png)');
		this.$.btnPlay.setIcon('play');
	},

	/**
	* plays the track previous to current track
	*
	* @public
	*/
	playPrevious: function () {
		if (this.$.audio.getCurrentTime() > this.playPrevThreshold ||
			this.repeat == 'one' ||
			(this.repeat == 'none' && this.index == 0)) {
			this.$.audio.seekTo(0);
			return;
		}

		if (this.index > 0) {
			this.index = this.index - 1;
		} else if (this.repeat == 'all') 
			this.index = this.audioTracks.length - 1;

		this.updateTrackIndex(this.shuffle ? this.playOrder[this.index] : this.index);
		this.play();
	},

	/**
	* plays the track after the current track
	*
	* @public
	*/
	playNext: function () {
		if (this.repeat == 'one') {
			this.$.audio.seekTo(0);
			return;
		}

		if (this.audioTracks.length > this.index + 1) {
			this.index = this.index + 1;
		} else if (this.repeat == 'all') 
			this.index = 0;
		else if (this.repeat == 'none') 
			return;

		this.updateTrackIndex(this.shuffle ? this.playOrder[this.index] : this.index);
		this.play();
	},

	/**
	* plays the track at the specified index
	*
	* @param {Number} index  The index of the track to play
	* @public
	*/
	playAtIndex: function (index) {
		this.index = (this.audioTracks.length > index) ? index : 0;
		this.updateTrackIndex(this.index);
		this.play();
	},

	/**
	* Adds an audio track to the list
	*
	* @fires moon.AudioPlayback#onAddAudio
	* @param {String} src  The url of the audio track to be added
	* @param {String} trackName  Track name
	* @param {String} artistName  Artist na me
	* @param {String} albumName  Album name
	* @param {String} albumArt  The url of the album art image
	* @param {String} duration  String specifying duration eg. '0:22'
	* @public
	*/
	addAudioTrack: function (src, trackName, artistName, albumName, albumArt, duration) {
		var t = {
			src: src,
			trackName: trackName,
			artistName: artistName,
			albumName: albumName,
			albumArt: albumArt,
			duration: duration
		};
		this.audioTracks[this.audioTracks.length] = t;
		this.updateTrackCount();
		this.waterfall('onAddAudio', {track: t, tracks: this.audioTracks, index: this.audioTracks.length});
	},

	/**
	* Empty audio track list
	*
	* @public
	*/
	removeAudioTrack: function(sender, event) {
		var index = this.getAudioIndexBySrc(event.src), t;
		if (index > -1) {
			t = this.audioTracks.splice(index, 1);
		}
		this.waterfall('onRemoveAudio', {track: t, tracks: this.audioTracks, index: index});
	},
	
	/**
	* Empty audio track list
	*
	* @public
	*/
	getAudioIndexBySrc: function (src) {
		var tracks = this.audioTracks,
			length = tracks ? tracks.length : 0,
			i;
		for(i=0; i < length; i++) {
			if (tracks[i].src == src) {
				return i;
			}
		}
		return -1;
	},

	/**
	* Empty audio track list
	*
	* @public
	*/
	emptyAudioTracks: function () {
		this.audioTracks = [];
		this.waterfall('onEmptyAudio');
	},

	/**
	* @private
	*/
	remoteKeyHandler: function (sender, event) {
		if (this.handleRemoteControlKey) {
			this.commandHandler({command: event.keySymbol});
		}
		return true;
	}
});