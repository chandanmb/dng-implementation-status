let services = (function (window, undefined) {

    


    let fetchModuleContents = async function (modules) {
        console.log("Iterate Each Artifact and Fetch Implemented By Links");




        let structure = await RmClientApi.getContentsStructure(modules, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.NAME]);
        let total = structure.length;
        let count = 1;


        for (ar of structure) {
            console.log("DEBUG");
            let linkedArtifactsList = new Map();
            //let linkedArtifactsList = [];
            let toSave = [];
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
                    let artifactAttributes = await RmClientApi.getModuleAttributes(key.ref, ["X_Implemented_By", RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.NAME]);
                    await artifactAttributes.forEach(item => {
                        let currentImplementationStatus = item.values['X_Implemented_By'];
                        var oslcStandardHeader = {
                            Accept: "application/rdf+xml",
                            "OSLC-Core-Version": "2.0",
                            "configuration-context": helper.localConfigurationUri
                        };

                        console.log(key + "--------------------------------------------------------" + value);
                        var status = OslcUtils.getRdf(value, oslcStandardHeader, OslcUtils.findRdfHTMLValue, "http://open-services.net/ns/cm#", "status", "rdf:resource");
                        console.log(status[0]);

                        item.values['X_Implemented_By'] = status[0];
                        toSave.push(item);
                        count++;
                    });
                };

            }
            if (toSave.length > 0) {
                let operationResult = await RmClientApi.setAttributes(toSave);
                for (p of operationResult) {
                    if (p.code != "OK") {
                        console.log(p.code + " Problem update artifact '" + p.message);
                    }
                }
            }
        }
    }
    return {
        getCurrentConfiguration: getCurrentConfiguration,
        fetchModuleContents: fetchModuleContents
    }
})();