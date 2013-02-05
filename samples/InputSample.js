enyo.kind({
	name: "moon.sample.InputSample",
	classes: "moon moon-sample moon-input-sample",
	kind: "FittableRows",
	components: [
		{kind: "enyo.Spotlight"},
		{classes: "moon-input-sample-wrapper", components: [
			{classes: "moon-list-divider", content: "Inputs"},
			{kind: "moon.InputDecorator", spotlight: true, components: [
				{kind: "moon.Input", placeholder: "JUST TYPE", onchange:"inputChanged"}
			]},
			{kind: "moon.InputDecorator", components: [
				{kind: "moon.Input", placeholder: "Search term", onchange:"inputChanged"},
				{kind: "Image", src: "assets/search-input-search.png"}
			]},
			{kind: "moon.InputDecorator", components: [
				{kind: "moon.Input", type:"password", placeholder: "Enter password", onchange:"inputChanged"}
			]},
			{kind: "moon.InputDecorator", disabled: true, components: [
				{kind: "moon.Input", disabled: true, value: "Disabled input"}
			]},
			{name: "console", classes: "moon-input-sample-console"}
		]}
	],
	inputChanged: function(inSender, inEvent) {
		this.$.console.setContent("Input: " + inSender.getValue());
	}
});
