$(document).ready(function () {
    $("#userErrorMessages").hide();
    $("#loadingIcon").hide();
    $("#progress").hide();
    $("#lblStatusCount").hide();

    console.log("Application loaded");
    if (helper == undefined) {

        $("#userErrorMessages").html(
            "<b><i>Switch to DNG to use this widget.</i></b>"
        );
        $("#userErrorMessages").show();
        $("#updateWIState").hide();
    } else {
        $("#userErrorMessages").html(
            "<i><b>Please select atleast one Module.</b></i>"
        );
        $("#updateWIState").hide();
        $("#userErrorMessages").show();

        var selection = [];
        //Capture the information about Configuration files 



        RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, function (artifactRef) {
            if (artifactRef.length <= 0) {


                //gadgets.window.adjustHeight(200);
                $("#userErrorMessages").html(
                    "<i><b>Please select atleast one Module.</b></i>"
                );
                $("#userErrorMessages").show();
                $("#updateWIState").hide();
                $("#lblStatusCount").hide();

            } else if (artifactRef.length > 1) {
                $("#userErrorMessages").html(
                    "<i><b>More than one Artifact can't be selected.</b></i>"
                );
                $("#userErrorMessages").show();
                $("#updateWIState").hide();
                $("#lblStatusCount").hide();
            }
            else {

                RM.Data.getAttributes(artifactRef, RM.Data.Attributes.FORMAT, function (result) {
                    if (result.data[0].values[RM.Data.Attributes.FORMAT] !== RM.Data.Formats.MODULE) {
                        console.log("The Selected Artifact is not a Module:" + selection);
                        $("#userErrorMessages").html(
                            "<i><b>Selected Artifact is not a module.</b></i>"
                        );
                        $("#userErrorMessages").show();
                        $("#updateWIState").hide();

                    } else {
                        $("#userErrorMessages").hide();
                        $("#updateWIState").show();
                        selection = artifactRef;
                    }
                });

            }

        });



        $("#updateWIState").click(async function () {
            const config = await getCurrentConfiguration();
            $("#lblStatusCount").text("");
            console.log(config.localConfigurationUri);
            helper.localConfigurationUri = config.localConfigurationUri;
            console.log("Iterate over the module and fetch for the links Implemented By");
            console.log("Length of the Requirement Artifacts" + selection.length);

            let status = await fetchModuleContents(selection[0]);

            if (status == "EXECUTED") {
                $("#progress").hide();
                $("#lblStatusCount").show();
                timeOut("Updated Successfully");
            } else {
                $("#progress").hide();
                $("#lblStatusCount").show();
                timeOut("Technical Issue , Please contact admin for Support");

            }
        });


        let timeOut = function (message) {
            $("#lblStatusCount").text(message);
            setTimeout(function () {
                $('#lblStatusCount').fadeOut('fast');
            }, 3000);
        }

        let getCurrentConfiguration = async function () {

            const p = new Promise((resolve, reject) => RM.Client.getCurrentConfigurationContext(opr => resolve(opr.data)));
            console.log(p);
            return p;
        }

        let fetchModuleContents = async function (modules) {
            console.log("Iterate Each Artifact and Fetch Implemented By Links");
            $("#progress").show();
            $("#lblStatusCount").show();



            let structure = await RmClientApi.getContentsStructure(modules, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.NAME]);
            let total = structure.length;
            let count = 0;
            let title = "";
            let msg = "Update module '" + title + "'.";
            let percentage;
            let toSave = [];

            for (ar of structure) {
                console.log("DEBUG");
                let linkedArtifactsList = new Map();
                //let linkedArtifactsList = [];

                let externalLinkedArtifact = await RmClientApi.getLinkedArtifacts(ar.ref);



                if (externalLinkedArtifact.externalLinks.length > 0) {

                    await externalLinkedArtifact.externalLinks.forEach(links => {
                        let targetNames = links.targets;
                        console.log("Target Values are ::: " + targetNames[0]);
                        linkedArtifactsList.set(ar, targetNames[0]);
                        //ar["target"] = targetNames[0];
                        //linkedArtifactsList.push(ar);

                    });

                }
                if (linkedArtifactsList.size > 0) {

                    for (const [key, value] of linkedArtifactsList.entries()) {
                        let artifactAttributes = await RmClientApi.getModuleAttributes(key.ref, ["Implementation_Status", RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.NAME]);
                        await artifactAttributes.forEach(item => {
                            if ((count % 5) == 0) {
                                $("#lblStatusCount").text(msg + " Evaluate " + count + " of " + total + " artifacts.");
                            }
                            let currentImplementationStatus = item.values['Implementation_Status'];
                            var oslcStandardHeader = {
                                Accept: "application/rdf+xml",
                                "OSLC-Core-Version": "2.0",
                                "configuration-context": helper.localConfigurationUri
                            };

                            console.log(key + "--------------------------------------------------------" + value);
                            var status = OslcUtils.getRdf(value, oslcStandardHeader, OslcUtils.findRdfHTMLValue, "http://open-services.net/ns/cm#", "status", "rdf:resource");
                            console.log(status[0]);

                            item.values['Implementation_Status'] = status[0];
                            toSave.push(item);
                            count++;
                        });
                    };

                }
                if (toSave.length > 0) {
                    /*  let counter = 0;
                     if (counter > 100 || counter == 0) { percentage = 0; }
 
 
                     else {
                         percentage = (counter / count) * 100;
                         $('.progress .progress-bar').css("width", function () {
                             return $(this).attr("aria-valuenow") + percentage + "%";
                         })
                     } */

                    $("#lblStatusCount").text("Set values for '" + count + "' artifacts.");
                    let operationResult = await RmClientApi.setAttributes(toSave);
                    for (p of operationResult) {
                        if (p.code != "OK") {
                            console.log(p.code + " Problem update artifact '" + p.message);
                            return "ERROR";
                        }
                    }
                    $("#lblStatusCount").text(count + " artifacts are updated out of " + total);
                    //toSave = [];
                }
            }
            return "EXECUTED";
        }

    }
});
