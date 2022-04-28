sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
	"sap/m/library",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, mobileLibrary) {
        "use strict";

        return BaseController.extend("listservices.controller.List", {
            onInit: function () {
                this.getAvailableServices();
               
                //var metadata = {};
                //metadata = JSON.stringify(metadata);
                //this.sendMetadata(metadata);
            },

            sendMetadata : function(metadata) {
                console.log(metadata)
                $.ajax({
                    url: 'srv-api/catalog/getMetadata',
                    type: 'POST',
                    dataType: "text",
                    contentType: "application/json",
                    data: JSON.stringify({"metadata": metadata}),
                    crossDomain: true,
                    processData: false,
                    success: function(data){
                        console.log("success: "+data);
                    },
                    error: function(e){
                        console.log("error: "+e);
                        console.log(JSON.stringify(e))
                    }
                  });
            },

            servicePressed : function(oEvent){
                console.log("test service pressed");
                let sPath = oEvent.getSource().getBindingContext().getPath();

                let oModel = this.getView().getModel();
                let oContext = oModel.getProperty(sPath);

                //info selected service
                console.log(oContext);

                let metaUrl = oContext.MetadataUrl;
                metaUrl = metaUrl.replaceAll('http://cloud.test', '');
                var modelUrl = metaUrl.replaceAll('/$metadata', '');

                console.log(modelUrl);

                var oModel2 = new sap.ui.model.odata.v2.ODataModel(modelUrl);
                var oView = this.getView();
                

                var oMetadata; 
                
                oModel2.attachMetadataLoaded(null, function(){
                   oMetadata = oModel2.getServiceMetadata();
                   console.log(oMetadata)

                   //console.log(JSON.stringify(oMetadata));
                 },null);

                console.log(oMetadata);

                 this.sendMetadata(oMetadata);
            },


            getAvailableServices : function(oEvent){
                //Filtering
                var filters = [];
                if(oEvent != undefined){
                    var serviceName = oEvent.getSource().getValue();
                    var filterServiceName = new sap.ui.model.Filter("Title",
                    sap.ui.model.FilterOperator.Contains, serviceName);
                    console.log("filter: "+serviceName);
                    
                    filters.push(filterServiceName);
                }

                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/");
                var oView = this.getView();

                console.log(oModel);
                oModel.read("/ServiceCollection", {
                    filters: filters,
                    success: function(data, response) {
                        console.log(data);
                        const jsonModel = new JSONModel();
                        jsonModel.setProperty("/services", data.results);
                        oView.setModel(jsonModel);
                    },
                    error: function(oError) {
                        console.log(oError);
                    }
                });	
            }
        });
    });
