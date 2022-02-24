/*jslint         browser : true, continue : true,
 devel  : true, indent  : 2,    maxerr   : 50,
 newcap : true, nomen   : true, plusplus : true,
 regexp : true, sloppy  : true, vars     : false,
 white  : true
 */

// insert/append a Link into a RDF/XML workitem or artefact
var OslcUtils = (function (window, undefined) {

    var gcWindow;

    function getRdf(uri, header, func, namespace, tag, node, append) {

        var result = '';

        $.ajax({
            url: uri,
            type: 'get',
            // dataType: 'xml',
            headers: header,
            success: function (data, textStatus, response) {
                //console.log(data.firstChild);
                var message = '';
                var statusErrorMap = {
                    '400': "Server understood the request, but request content was invalid.",
                    '401': "Unauthorized access.",
                    '403': "Forbidden resource can't be accessed.",
                    '500': "Internal server error.",
                    '503': "Service unavailable."
                };
                if (response.status && response.status != 200) {
                    message = statusErrorMap[response.status];
                    if (!message) {
                        message = "Unknown Error \n.";
                    }
                    // $('#ajaxError').html('<p>status code: '+response.status+'</p><p>errorThrown: ' + message + '<br/></p><p>Requested URI : ' + uri + '</p>');
                    return "Error!";
                }

                result = func(data, namespace, tag, node, append, response);
                //  result = data;
            },
            error: function (jqXHR, textStatus, errorThrown, uri) {
                console.log("Error occured");
                processAjaxError(jqXHR, textStatus, errorThrown, uri);
            },
            async: false
        });

        return result;

    }

    function getRdfAsync(uri, header, func, namespace, tag, node, append) {

        var result = '';

        $.ajax({
            url: uri,
            type: 'get',
            dataType: 'xml',
            headers: header,
            async: true,
            success: function (data, textStatus, response) {
                //console.log(data.firstChild);
                var message = '';
                var statusErrorMap = {
                    '400': "Server understood the request, but request content was invalid.",
                    '401': "Unauthorized access.",
                    '403': "Forbidden resource can't be accessed.",
                    '500': "Internal server error.",
                    '503': "Service unavailable."
                };
                if (response.status && response.status != 200) {
                    message = statusErrorMap[response.status];
                    if (!message) {
                        message = "Unknown Error \n.";
                    }
                    // $('#ajaxError').html('<p>status code: '+response.status+'</p><p>errorThrown: ' + message + '<br/></p><p>Requested URI : ' + uri + '</p>');
                    return "Error!";
                }

                result = func(data, namespace, tag, node, append, response);
                //  result = data;
            },
            error: function (jqXHR, textStatus, errorThrown, uri) {
                processAjaxError(jqXHR, textStatus, errorThrown, uri);
            }
        });

        return result;

    };

    var getCatalogUrl = function (rootServiceUrl, header, catalogNamespace, catalogDescription) {

        return getRdf(rootServiceUrl, header, OslcUtils.findRdfElement, catalogNamespace, catalogDescription, "rdf:resource");

    };

    var getServiceProvider = function (catalogUrl, header, project) {

        var services = getRdf(catalogUrl, header, OslcUtils.findRdfElement, "http://open-services.net/ns/core#", "serviceProvider", "rdf:resource");

        for (var i = 0; i < services.length; i++) {

            var sp = getRdf(services[i], header, OslcUtils.findRdfElementValueList, "http://purl.org/dc/terms/", "title");
            //console.log(serviceProviderList[i]);
            for (var j = 0; j < sp.length; j++) {

                if (sp[j] == project)
                    return services[i];

            }

        }

        return null;

    };


    var getQueryCapability = function (serviceUrl, header, resourceType) {

        if (typeof resourceType != 'undefined') {
            return getRdf(serviceUrl, header, findQueryCapabilityByType, resourceType);
        }
        return getRdf(serviceUrl, header, findQueryCapability);

    };

    var getGcComponent = function (url, header, filter) {

        return getRdf(url, header, findGcComponent, filter);

    };

    var findRdfElement = function (data, namespace, tag, node) {

        var foundTag = data.documentElement.getElementsByTagNameNS(namespace, tag);

        //or 
        var found = [];
        if (foundTag.length > 0) {
            for (var i = 0; i < foundTag.length; i++) {
                //log.info(foundReqs[i]);
                found.push(foundTag[i].getAttributeNode(node).value);
            }
        }

        return found;
    };


    var findComponent = function (data, projectArea) {

        var foundTag = data.documentElement.getElementsByTagNameNS("http://jazz.net/xmlns/prod/jazz/process/0.6/", "project-area");
        if (foundTag.length > 0) {
            for (var i = 0; i < foundTag.length; i++) {
                var project = foundTag[i];
                // var x = foundTag[i].getAttributeNode("name").value;
                var x = foundTag[i].getAttributeNS("http://jazz.net/xmlns/prod/jazz/process/0.6/", "name");
                if (x === projectArea) {
                    var childNodes = project.childNodes;
                    for (var j = 0; j < childNodes.length; j++) {
                        node = childNodes[j];
                        if (node.localName === "component") {
                            var z = childNodes[j].innerHTML;
                            return z;
                        }
                    }
                }
            }

        }
        return null;
    };

    var findConfigurtions = function (data) {

        var foundConfigurations = data.documentElement.getElementsByTagNameNS("http://www.w3.org/2000/01/rdf-schema#", "member");
        var found = [];
        if (foundConfigurations.length > 0) {

            for (var i = 0; i < foundConfigurations.length; i++) {
                found.push(foundConfigurations[i].getAttributeNode("rdf:resource").value);
                var z = 0;
            }

        }

        return found;

    }

    var getConfigurationData = function (data) {
        var titleNamespace = "http://purl.org/dc/terms/";
        var titleTag = "title"; // linkTypeId

        var stream = data.documentElement.getElementsByTagNameNS("http://open-services.net/ns/config#", "baselineOfStream");
        if (stream !== null) {
            var name = data.documentElement.getElementsByTagNameNS(titleNamespace, titleTag)[0].textContent;
            return name;
        }

        return null;

    };

    var findRdfElementValue = function (data, namespace, tag) {

        var foundReqs = data.documentElement.getElementsByTagNameNS(namespace, tag);

        //or 
        var found = [];

        if (foundReqs.length > 0) {
            return foundReqs[0].attributes[0].nodeValue
            //found.push(foundReqs[0].textContent);       
        }
        return null;

    };


    var findRdfHTMLValue = function (data, namespace, tag) {

        var foundReqs = data.documentElement.getElementsByTagNameNS(namespace, tag);

        //or 
        var found = [];

        if (foundReqs.length > 0) {

            found.push(foundReqs[0].innerHTML);

        }

        return found;

    };

    var findRdfElementValueList = function (data, namespace, tag) {

        var valueList = data.documentElement.getElementsByTagNameNS(namespace, tag);

        var found = [];

        if (valueList.length > 0) {
            for (var i = 0; i < valueList.length; i++) {
                found.push(valueList[i].textContent);
            }

        }

        return found;
    };

    var findGcComponent = function (data, filter) {

        var namespace = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
        var attribute = "Description";


        var valueList = data.documentElement.getElementsByTagNameNS(namespace, attribute);

        for (var i = 0; i < valueList.length; i++) {
            for (var j = 0; j < valueList[i].children.length; j++) {

                if (valueList[i].children.item(j).attributes.getNamedItemNS(namespace, "resource") != null) {
                    //    console.log(" ---> " + valueList[i].children.item(j).attributes.getNamedItem("rdf:resource"));
                    if (valueList[i].children.item(j).attributes.getNamedItemNS(namespace, "resource").value == filter)
                        return valueList[i].attributes.getNamedItemNS(namespace, "about").value;
                }
            }
        }
        return null;
    };

    var findGcConfigurations = function (data, namespace, tag) {

        var valueList = data.documentElement.getElementsByTagNameNS(namespace, tag);

        var result = [];

        for (var i = 0; i < valueList.length; i++) {
            if (valueList[i].children.item(0).nodeName === "dcterms:title")
                result.push({ "title": valueList[i].children.item(0).innerHTML, "uri": valueList[i].attributes.getNamedItemNS(namespace, "about").value });
            /* for (var j = 0; j < valueList[i].children.length; j++) {
                 if (valueList[i].children.item(j).attributes.getNamedItem("dcterms:title") != null) {
                    // console.log(" ---> " + valueList[i].children.item(j).attributes.getNamedItem("rdf:resource"));
                     if (valueList[i].children.item(j).attributes.getNamedItem("rdf:resource").value == filter) {
                         result.push({"title" : valueList[i].children.item(j).attributes.getNamedItem("dcterms:title").innerHTML, valueList[i].attributes.getNamedItemNS(namespace, "about").value})
 
                 }
             }*/
        }
        return result;
    };

    var findServiceProvider = function (data, projectName) {

        var namespace = "http://open-services.net/ns/core#";
        var tag = "serviceProvider";
        var providers = data.documentElement.getElementsByTagNameNS(namespace, tag);

        if (providers.length > 0) {
            for (var i = 0; i < providers.length; i++) {
                var provider = providers[i].childNodes;
                for (var j = 0; j < provider.length; j++) {
                    var node = provider[j];
                    if (node.localName === "ServiceProvider") {
                        for (var k = 0; k < node.children.length; k++) {
                            if (node.children[k].nodeName === "dcterms:title") {
                                if (node.children[k].innerHTML === projectName) {
                                    //console.log(" Service Provider Url >>> " + node.attributes.getNamedItem("rdf:about"));
                                    return node.attributes.getNamedItem("rdf:about").value;
                                }
                            }
                            console.log(node.children[k].nodeName)
                        }
                    }
                }

            }

        }
    };

    var findQueryCapability = function (data) {

        var namespace = "http://open-services.net/ns/core#";
        var tag = "Service";
        var services = data.documentElement.getElementsByTagNameNS(namespace, tag);

        if (services.length > 0) {
            for (var i = 0; i < services.length; i++) {
                var service = services[i].childNodes;
                for (var j = 0; j < service.length; j++) {
                    var node = service[j];
                    //console.log(node.localName);
                    if (node.localName === "queryCapability") {
                        //console.log("Found query capability");
                        for (var k = 0; k < node.children.length; k++) {
                            if (node.children[k].nodeName === "oslc:QueryCapability") {
                                nodeChildren = node.children[k].children;
                                //console.log("nodeChildren.innerHTML " + nodeChildren.innerHTML);
                                var base = "";
                                var found = false;
                                for (var l = 0; l < nodeChildren.length; l++) {
                                    //console.log("nodeChildren.innerHTML " + nodeChildren[l].localName);
                                    if (nodeChildren[l].localName === "queryBase") {
                                        base = nodeChildren[l].attributes.getNamedItem("rdf:resource").value;
                                        //console.log("Found querybase " + base); 
                                    }
                                    if (nodeChildren[l].localName === "title") {
                                        if (nodeChildren[l].innerHTML === "Query Capability") {
                                            found = true;
                                        }
                                    }
                                }
                                if (found) {
                                    return base;
                                }
                            }
                            console.log(node.children[k].nodeName)
                        }
                    }
                }
            }
        }
    };

    var findQueryCapabilityByType = function (data, type) {

        var namespace = "http://open-services.net/ns/core#";
        var tag = "Service";
        var services = data.documentElement.getElementsByTagNameNS(namespace, tag);

        if (services.length > 0) {
            for (var i = 0; i < services.length; i++) {
                var service = services[i].childNodes;
                for (var j = 0; j < service.length; j++) {
                    var node = service[j];
                    // console.log(node.localName);
                    if (node.localName === "queryCapability") {
                        //   console.log("Found query capability");
                        for (var k = 0; k < node.children.length; k++) {
                            if (node.children[k].nodeName === "oslc:QueryCapability") {
                                nodeChildren = node.children[k].children;
                                //         console.log("nodeChildren.innerHTML " + nodeChildren.innerHTML);
                                var base = "";
                                var found = false;
                                for (var l = 0; l < nodeChildren.length; l++) {
                                    //           console.log("nodeChildren.innerHTML " + nodeChildren[l].localName);
                                    if (nodeChildren[l].localName === "queryBase") {
                                        base = nodeChildren[l].attributes.getNamedItem("rdf:resource").value;
                                        //             console.log("Found querybase " + base); 
                                    }
                                    if (nodeChildren[l].localName === "resourceType") {
                                        if (nodeChildren[l].attributes.getNamedItem("rdf:resource").value === type) {
                                            found = true;
                                        }
                                    }
                                }
                                if (found) {
                                    return base;
                                }
                            }
                            console.log(node.children[k].nodeName)
                        }
                    }
                }
            }
        }
    };

    var createModuleQuery = function (queryCapability) {

        var oslcPrefix = "dcterms=<http://purl.org/dc/terms/>,rdf=<http://www.w3.org/1999/02/22-rdf-syntax-ns#>";
        var oslcSelect = "dcterms:title,rdf:type";
        var oslcWhere = "rdf:type=<http://open-services.net/ns/rm#RequirementCollection>";

        var oslcQuery = queryCapability
            + "&oslc.prefix=" + encodeURIComponent(oslcPrefix)
            + "&oslc.select=" + encodeURIComponent(oslcSelect)
            + "&oslc.where=" + encodeURIComponent(oslcWhere);

        return oslcQuery;

    };

    var createModuleDropDownList = function (data) {

        var namespace = "http://www.w3.org/2000/01/rdf-schema#";
        var tag = "member";
        var member = data.documentElement.getElementsByTagNameNS(namespace, tag);

        var moduleSelect = document.createElement('select');
        moduleSelect.id = "module_selector";
        moduleSelect.addEventListener(
            'change',
            function () { control.moduleSelect(this.id); },
            false
        );

        var selectHTML = '<option value="undefined">Choose a Module</option>';
        var result = [];

        if (member.length > 0) {
            document.getElementById('module_selection').innerHTML = "";
            for (var i = 0; i < member.length; i++) {
                var uri = member[i].children[0].attributes.getNamedItem("rdf:about").value;
                var children = member[i].children[0];
                var name = children.children[0].innerHTML;
                result.push({ "name": name, "uri": uri });
                selectHTML += '<option value="' + uri + '">' + name + '</option>';
            }
        }

        moduleSelect.innerHTML = selectHTML;
        document.getElementById('module_selection').appendChild(moduleSelect);
        document.getElementById('spinner_item').hidden = true;
        document.getElementById('module_selection').hidden = false;
        ocument.getElementById('synchronizeArtifacts').hidden = false;
        document.getElementById('buttonName').innerHTML = "Import";

    };


    function processAjaxError(jqXHR, textStatus, errorThrown, uri) {

        document.getElementById('spinner_item').hidden = true;

        if (jqXHR.status && jqXHR.status == 401) {
            myWindow = parent.window.open(location.origin + "/gc/whoami", "_blank", "width=1,height=1");
            myWindow.blur();
            parent.window.focus();

            setTimeout(function () {
                myWindow.close();
                location.reload();
            }, 2000);

            //$('#ajaxError').html('<i class="icon-warning-sign"></i>' + '<p>Status code: '+jqXHR.status+'</p><p>Message: ' + message + '<br/></p>');
            //rm.errorOccured = "Error";
        } else if (jqXHR.status && jqXHR.status != 200) {
            var message = "Couldn't find defined GC Component. Please verify your settings."
            $('#ajaxError').html('<i class="icon-warning-sign"></i>' + '<p>Message: ' + message + '<br/></p>');
            //rm.errorOccured = "Error";
        }
    };

    var findProjectAreaUri = function (data, projectArea) {

        var foundTag = data.documentElement.getElementsByTagNameNS("http://jazz.net/xmlns/prod/jazz/process/0.6/", "project-area");
        if (foundTag.length > 0) {
            for (var i = 0; i < foundTag.length; i++) {
                var project = foundTag[i];
                if (project.getAttributeNS("http://jazz.net/xmlns/prod/jazz/process/0.6/", "name") === projectArea) {
                    for (var j = 0; j < project.childElementCount; j++) {
                        if (project.children[j].localName === "url") {
                            var paUri = project.children[j].textContent.split("/");
                            return paUri[paUri.length - 1];
                        }
                    }

                }
            }

        }
        return null;

    };

    var getComponents = function (data) {
        var element = data.getElementsByTagNameNS("http://jazz.net/xmlns/prod/jazz/process/0.6/", "project-area")[0];
        for (var i = 0; i < element.childElementCount; i++) {
            if (element.children[i].localName === "components") {
                return element.children[i].textContent;
            }
        }
        return null;
    };

    var getComponentList = function (data) {

        var foundTag = data.documentElement.getElementsByTagNameNS("http://jazz.net/xmlns/prod/jazz/process/0.6/", "project-area");
        var resultList = [];
        if (foundTag.length > 0) {
            for (var i = 0; i < foundTag.length; i++) {
                var component = foundTag[i];
                var name = component.getAttributeNS("http://jazz.net/xmlns/prod/jazz/process/0.6/", "name");
                resultList.push(name);
            }
        }

        return resultList;


    }

    return {
        //insertLink              :             insertLink,
        findRdfElement: findRdfElement,
        findRdfElementValue: findRdfElementValue,
        getRdf: getRdf,
        /*getDngExternalLinks		:			  getDngExternalLinks,
        createUpdateList		:			  createUpdateList, */
        findComponent: findComponent,
        findConfigurtions: findConfigurtions,
        getConfigurationData: getConfigurationData,
        findRdfElementValue: findRdfElementValue,
        findRdfHTMLValue: findRdfHTMLValue,
        findRdfElement: findRdfElement,
        findServiceProvider: findServiceProvider,
        findQueryCapability: findQueryCapability,
        createModuleQuery: createModuleQuery,
        createModuleDropDownList: createModuleDropDownList,
        getRdfAsync: getRdfAsync,
        findProjectAreaUri: findProjectAreaUri,
        getComponents: getComponents,
        getComponentList: getComponentList,
        findRdfElementValueList: findRdfElementValueList,
        findQueryCapabilityByType: findQueryCapabilityByType,
        findGcComponent: findGcComponent,
        findGcConfigurations: findGcConfigurations,
        getCatalogUrl: getCatalogUrl,
        getServiceProvider: getServiceProvider,
        getQueryCapability: getQueryCapability,
        getGcComponent: getGcComponent


    };

})();