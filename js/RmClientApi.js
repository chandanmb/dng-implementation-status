let RmClientApi = function () {

    let config = async function () {

        await new Promise((resolve, reject) => RM.Client.getCurrentConfigurationContext(opr => resolve(opr.data)));
    }

    let getContentsStructure = async function (artifact, attributes) {
        const p = new Promise((resolve, reject) =>
            RM.Data.getContentsStructure(artifact, attributes, opr => resolve(opr.data)));
        return p;
    }


    let getModuleAttributes = async function (artifact, attributes) {
        const p = new Promise((resolve, reject) =>
            RM.Data.getAttributes(artifact, attributes, opr => resolve(opr.data)));
        return p;
    }

    let setAttributes = async function (toSave) {
        const p = new Promise((resolve, reject) =>
            RM.Data.setAttributes(toSave, opr => resolve(opr.data)));
        return p;

    }

    let getLinkedArtifacts = async function (artifact) {
        const p = new Promise((resolve, reject) => RM.Data.getLinkedArtifacts(artifact, opr => resolve(opr.data)));
        return p;
    }
    return {
        config: config,
        getContentsStructure: getContentsStructure,
        getModuleAttributes: getModuleAttributes,
        setAttributes: setAttributes,
        getLinkedArtifacts: getLinkedArtifacts
    }
}();