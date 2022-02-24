var helper = (function (window, undefined) {
    console.log("Helper File ");
    var baseUrl = location.protocol + '//' + location.host;
    let userId;
    let localConfigurationUri;

    RM.Client.getCurrentConfigurationContext(function (result) {
        if (result.code === RM.OperationResult.OPERATION_OK) {
            var context = result.data;
            console.log('The current local configuration is ' + context.localConfigurationUri);
        }
    });
    return {
        baseUrl: baseUrl,
        localConfigurationUri: localConfigurationUri,
        userId: userId
    }

})();