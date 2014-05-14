enyo.kind({
	name: "moon.sample.DataGridListSample",
	kind: "moon.Panels",
	popOnBack: true,
	pattern: "activity",
	classes: "moon enyo-fit",
	components: [
		{kind: "moon.Panel", deferRender: true, classes:"moon-6h", title:"Menu", components: [
			{kind:"moon.Item", content:"Scroll"},
			{kind:"moon.Item", content:"the"},
			{kind:"moon.Item", content:"Data Grid List"},
			{kind:"moon.Item", content:"to"},
			{kind:"moon.Item", content:"the"},
			{kind:"moon.Item", content:"Right!"}
		]},
		{kind: "moon.Panel", joinToPrev: true, deferRender: true, title:"Data Grid List", headerComponents: [
			{kind: "moon.ToggleButton", content:"Selection", name:"selectionToggle"},
			{kind: "moon.ToggleButton", content:"MultiSelect", name:"multiSelectToggle"},
			{kind: "moon.Button", content:"Refresh", ontap:"refreshItems"},
			{kind: "moon.Button", content:"Push Panel", ontap:"addPanel"},
			{kind: "moon.ContextualPopupDecorator", components: [
				{kind: "moon.ContextualPopupButton", content:"Popup List"},
				{kind: "moon.ContextualPopup", classes:"moon-6h moon-8v", components: [
					{kind:"moon.DataList", components: [
						{kind:"moon.CheckboxItem", bindings: [
							{from:".model.text", to:".content"}
						]}
					]}
				]}
			]}
		], components: [
			{name: "gridList", fit: true, spacing: 20, minWidth: 180, minHeight: 270, kind: "moon.DataGridList", scrollerOptions: { kind: "moon.Scroller", vertical:"scroll", horizontal: "hidden", spotlightPagingControls: true }, components: [
				{ kind: "moon.sample.GridSampleItem" }
			]}
		]},
		{kind: "moon.Panel", title:"Data Grid List", deferRender: true, headerComponents: [
			{kind: "moon.Button", content:"Refresh", ontap:"refreshItems"},
			{kind: "moon.Button", content:"Push Panel", ontap:"addPanel"},
		], components: [
			{name: "gridList1", fit: true, spacing: 20, minWidth: 180, minHeight: 270, kind: "moon.DataGridList", scrollerOptions: { kind: "moon.Scroller", vertical:"scroll", horizontal: "hidden", spotlightPagingControls: true }, components: [
				{ kind: "moon.sample.GridSampleItem" }
			]}
		]},
		{kind: "moon.Panel", title:"Data Grid List", deferRender: true, headerComponents: [
			{kind: "moon.Button", content:"Refresh", ontap:"refreshItems"},
			{kind: "moon.Button", content:"Push Panel", ontap:"addPanel"},
		], components: [
			{name: "gridList2", fit: true, spacing: 20, minWidth: 180, minHeight: 270, kind: "moon.DataGridList", scrollerOptions: { kind: "moon.Scroller", vertical:"scroll", horizontal: "hidden", spotlightPagingControls: true }, components: [
				{ kind: "moon.sample.GridSampleItem" }
			]}
		]}
	],
	bindings: [
		{from: ".collection", to: ".$.dataList.collection"},
		{from: ".collection", to: ".$.gridList.collection"},
		{from: ".collection", to: ".$.gridList1.collection"},
		{from: ".collection", to: ".$.gridList2.collection"},
		{from: ".collection", to: ".$.gridList3.collection"},
		{from: ".$.selectionToggle.value", to:".$.gridList.selection"},
		{from: ".$.multiSelectToggle.value", to:".$.gridList.multipleSelection"}
	],
	create: function () {
		this.inherited(arguments);
		// we set the collection that will fire the binding and add it to the list
		this.set("collection", new enyo.Collection(this.generateRecords()));
	},
	rendered: function() {
		this.inherited(arguments);
		// Set Initial Panel: This should not get delayed whatever the depth is
		this.setIndex(3);
	},
	generateRecords: function () {
		var records = [],
			idx     = this.indexCache || 0;
		for (; records.length < 500; ++idx) {
			var title = (idx % 8 === 0) ? " with long title" : "";
			var subTitle = (idx % 8 === 0) ? "Lorem ipsum dolor sit amet" : "Subtitle";
			records.push({
				text: "Item " + idx + title,
				subText: subTitle,
				url: "http://placehold.it/300x300/" + Math.floor(Math.random()*0x1000000).toString(16) + "/ffffff&text=Image " + idx
			});
		}
		// update our internal indexCache so it will always generate unique values
		this.indexCache = idx;
		return records;
	},
	refreshItems: function () {
		// we fetch our collection reference
		var collection = this.get("collection");
		// we now remove all of the current records from the collection
		collection.removeAll();
		// and we insert all new records that will update the list
		collection.add(this.generateRecords());
	},
	addPanel: function() {
		this.pushPanel(
			{kind: "moon.Panel", title:"Data Grid List", headerComponents: [
				{kind: "moon.Button", content:"Back", ontap:"backToPrev"},
			], components: [
				{name: "gridList3", fit: true, spacing: 20, minWidth: 180, minHeight: 270, kind: "moon.DataGridList", scrollerOptions: { kind: "moon.Scroller", vertical:"scroll", horizontal: "hidden", spotlightPagingControls: true }, components: [
					{ kind: "moon.sample.GridSampleItem" }
				]}
			]}
		);
	},
	backToPrev: function(inSender, inEvent) {
		this.previous();
	}
});

enyo.kind({
	name: "moon.sample.GridSampleItem",
	kind: "moon.GridListImageItem",
	mixins: ["moon.SelectionOverlaySupport"],
	selectionOverlayVerticalOffset: 35,
	subCaption: "Sub Caption",
	bindings: [
		{from: ".model.text", to: ".caption"},
		{from: ".model.subText", to: ".subCaption"},
		{from: ".model.url", to: ".source"}
	]
});