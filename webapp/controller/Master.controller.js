sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"com/minda/PaymentAdvice/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/m/MessageBox',
	"sap/ui/core/Element",
	"sap/m/MessageToast",
	"com/minda/PaymentAdvice/model/formatter"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, Element, MessageToast, formatter) {
	"use strict";

	return Controller.extend("com.minda.PaymentAdvice.controller.Master", {
		formatter: formatter,
		onInit: function () {
			// debugger;
			this.getOwnerComponent().setModel(new JSONModel({
				busy: true,
			}), "listViewModel");
			this.oRouter = this.getOwnerComponent().getRouter();
			this._bDescendingSort = false;
			this._getUserDetails();
		},

		onListItemPress: function (oEvent) {
			oEvent.getParameter("listItem").setSelected(true);
			this.oRouter.navTo("detail", {
				DocumentNo: oEvent.getParameter("listItem").getBindingContext("voucherModel").getObject().DocumentNo
			});
		},
		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("DocumentNo", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
		},

		onSort: function (oEvent) {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId("table"),
				oBinding = oTable.getBinding("items"),
				oSorter = new Sorter("DocumentNo", this._bDescendingSort);
			oBinding.sort(oSorter);
		},
		onUpdateFinished: function (oEvent) {
			if (oEvent.getSource().getItems()[0] == undefined) {
				this.oRouter.navTo("404");
			} else {
				if (!this.getOwnerComponent().getModel("device").getProperty("/system/phone")) {
					oEvent.getSource().getItems()[0].setSelected(true);
					this.oRouter.navTo("detail", {
						DocumentNo: oEvent.getSource().getItems()[0].getBindingContext("voucherModel").getObject().DocumentNo
					});
				}
			}

		},
		_applyFilter: function (oFilter) {
			var oTable = this.byId("table");
			oTable.getBinding("items").filter(oFilter);
		},

		handleFacetFilterReset: function (oEvent) {
			var oFacetFilter = Element.registry.get(oEvent.getParameter("id")),
				aFacetFilterLists = oFacetFilter.getLists();

			for (var i = 0; i < aFacetFilterLists.length; i++) {
				aFacetFilterLists[i].setSelectedKeys();
			}

			this._applyFilter([]);
		},

		handleListClose: function (oEvent) {
			// Get the Facet Filter lists and construct a (nested) filter for the binding
			var oFacetFilter = oEvent.getSource().getParent();

			this._filterModel(oFacetFilter);
		},

		handleConfirm: function (oEvent) {
			// Get the Facet Filter lists and construct a (nested) filter for the binding
			var oFacetFilter = oEvent.getSource();
			this._filterModel(oFacetFilter);
			MessageToast.show("confirm event fired");
		},

		_filterModel: function (oFacetFilter) {
			var mFacetFilterLists = oFacetFilter.getLists().filter(function (oList) {
				return oList.getSelectedItems().length;
			});

			if (mFacetFilterLists.length) {
				// Build the nested filter with ORs between the values of each group and
				// ANDs between each group
				var oFilter = new Filter(mFacetFilterLists.map(function (oList) {
					return new Filter(oList.getSelectedItems().map(function (oItem) {
						return new Filter(oList.getKey(), "EQ", oItem.getText());
					}), false);
				}), true);
				this._applyFilter(oFilter);
			} else {
				this._applyFilter([]);
			}
		}

	});

});