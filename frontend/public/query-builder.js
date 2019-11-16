/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    //Find Data Type
    let header = document.getElementsByClassName("nav-item tab active")[0];
    let dataType = header.attributes[1].nodeValue;
    let CP = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
    let RP = ["lat", "lon", "seats", "fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href"];
    let RNProperties = ["lat", "lon", "seats"];
    let CNProperties = ["avg", "pass", "fail", "audit", "year"];
    let standard = [];
    let standardN = [];
    if (dataType == "courses") {
        standard = CP;
        standardN = CNProperties;
    } else {
        standard = RP;
        standardN = RNProperties;
    }
    //Find Where
    let conditionsFrame = document.getElementsByClassName("form-group conditions")[0];
    let conditions = conditionsFrame.getElementsByClassName("conditions-container")[0];
    let filters = conditions.getElementsByClassName("control-group condition");
    let propertiesInCond = [];
    let operationsInCond = [];
    let hasNOT = [];
    let inputsInCond = [];
    //read conditions
    let applyProperty, getOptions, selected, modifiedS;
    // selected is a string indicates the property applied in each conditions eg. avg/dept

    let applyOperator, operators, operation;
    // operation is a string indicates the operation applied in each condition eg.EQ GT

    let applyInput, inputTag, typed;
    // typed is a string entered manually

    let notCondition, inputNot, inputNotL;
    for (let filter of filters) {
        applyProperty = filter.getElementsByClassName("control fields")[0];
        getOptions = applyProperty.getElementsByTagName("select")[0];
        selected = getOptions.options[getOptions.selectedIndex].value;
        modifiedS = dataType + "_" + selected;
        propertiesInCond.push(modifiedS);

        applyOperator = filter.getElementsByClassName("control operators")[0];
        operators = applyOperator.getElementsByTagName("select")[0];
        operation = operators.options[operators.selectedIndex].value;
        operationsInCond.push(operation);

        applyInput = filter.getElementsByClassName("control term")[0];
        inputTag = applyInput.getElementsByTagName("input")[0];
        typed = inputTag["value"];
        if (standardN.indexOf(selected) >= 0) {
            typed = Number(typed);
        }
        inputsInCond.push(typed);

        notCondition = filter.getElementsByClassName("control not")[0];
        inputNot = notCondition.getElementsByTagName("input")[0];
        inputNotL = inputNot.attributes.length;
        hasNOT.push(inputNotL === 2);
    }

    // processing the arrays we get from where
    let allConditions = [];
    let propertyAndInput = new Object();
    let addOperation = new Object();
    let addNOT = new Object();
    let withConnector = new Object();
    let i = 0;
    for (i; i < inputsInCond.length; i++) {
        propertyAndInput[propertiesInCond[i]] = inputsInCond[i];
        addOperation[operationsInCond[i]] = propertyAndInput;
        if (hasNOT[i]) {
            addNOT["NOT"] = addOperation;
            allConditions.push(addNOT);
        } else {
            allConditions.push(addOperation);
        }
        addNOT = new Object();
        addOperation = new Object();
        propertyAndInput = new Object();
    }
    if (allConditions.length === 0) {
        query["WHERE"] = {};
    }
    let connections = document.getElementsByClassName("control-group condition-type")[0];
    let allConnections = connections.getElementsByClassName("control");
    let inputInConnection, connector;
    ;
    for (let eachConnection of allConnections) {
        inputInConnection = eachConnection.getElementsByTagName("input")[0];
        if (inputInConnection.attributes.length === 5) {
            connector = inputInConnection["value"];
        }
    }
    if (connector === "all") {
        connector = "AND";
    }
    if (connector === "any") {
        connector = "OR";
    }
    if (connector === "none") {
        connector = "NOT";
    }
    if (allConditions.length === 1 && connector !== "NOT") {
        query["WHERE"] = allConditions[0];
    } else {
        withConnector[connector] = allConditions;
        query["WHERE"] = withConnector;
    }


    //Find Columns
    let cols = document.getElementsByClassName("form-group columns")[0];
    let col = cols.getElementsByClassName("control-group")[0];
    let colProperties = col.getElementsByTagName("input");
    let modifiedField;
    let columns = [];
    let j = 1;
    for (let colProperty of colProperties) {
        if (colProperty.checked) {
            if (j <= 10) {
                modifiedField = dataType + "_" + colProperty["value"];
                columns.push(modifiedField);
            } else {
                columns.push(colProperty["value"]);
            }
        }
        j++;
    }
    //Find Order
    let OrderField = document.getElementsByClassName("form-group order")[0];
    let OrderOptions = OrderField.getElementsByClassName("control order fields")[0];
    let allOptions = OrderOptions.getElementsByTagName("select")[0];
    let selectedForOrder = [];
    for (let eachOption of allOptions) {
        if (eachOption.selected) {
            selectedForOrder.push(eachOption.value);
        }
    }
    let counterForOrder = 0;
    let orderWithDataType;
    for (let eachInOrd of selectedForOrder) {
        if (standard.indexOf(eachInOrd) >= 0) {
            orderWithDataType = dataType + "_" + eachInOrd;
            selectedForOrder[counterForOrder] = orderWithDataType;
        }
        counterForOrder++;
    }
    let descending;
    let descendingPart = OrderField.getElementsByClassName("control descending")[0];
    let descendingChecker = descendingPart.getElementsByTagName("input")[0];
    if (descendingChecker.checked) {
        descending = true;
    } else {
        descending = false;
    }
    let options = new Object();
    let oderObject = new Object();
    options["COLUMNS"] = columns;
    if (!descending && selectedForOrder.length == 1) {
        options["ORDER"] = selectedForOrder[0];
    } else {
        oderObject["keys"] = selectedForOrder;
        if (descending) {
            oderObject["dir"] = "DOWN";

        } else {
            oderObject["dir"] = "UP";
        }
        options["ORDER"] = oderObject;
    }
    query["OPTIONS"] = options;

    let groupPart = document.getElementsByClassName("form-group groups")[0];
    let allOptForGroup = groupPart.getElementsByTagName("input");
    let groupByThem = [];
    let transOptForGroup;
    for (let eachOptForGroup of allOptForGroup) {
        if (eachOptForGroup.checked) {
            transOptForGroup = dataType + "_" + eachOptForGroup.value;
            groupByThem.push(transOptForGroup);
        }
    }
    if (groupByThem.length === 0) {
        return query;
    }
    let transObject = new Object();
    transObject["GROUP"] = groupByThem;
    // FIND APPLY
    let applyPart = document.getElementsByClassName("transformations-container")[0];
    let newApply = applyPart.getElementsByClassName("control-group transformation");
    let newNames = [];
    let aggregateOp = [];
    let aggregateProp = [];
    let eachName, eachOpt, eachProp, modifiedProp;
    let term, operationChoicesFrame, operatorChoices, propChoices, propChoicesFrame;
    for (let eachApply of newApply) {
        term = eachApply.getElementsByClassName("control term")[0];
        eachName = term.getElementsByTagName("input")[0]["value"];
        newNames.push(eachName);
        operationChoicesFrame = eachApply.getElementsByClassName("control operators")[0];
        operatorChoices = operationChoicesFrame.getElementsByTagName("select")[0];
        eachOpt = operatorChoices.options[operatorChoices.selectedIndex].value;
        aggregateOp.push(eachOpt);
        propChoicesFrame = eachApply.getElementsByClassName("control fields")[0];
        propChoices = propChoicesFrame.getElementsByTagName("select")[0];
        eachProp = propChoices.options[propChoices.selectedIndex].value;
        modifiedProp = dataType + "_" + eachProp;
        aggregateProp.push(modifiedProp);

    }
    let applyObjects = [];
    let applyWithOperation = new Object();
    let applyWithName = new Object();
    let applyObjectCounter = 0;
    let applyObjectsNum = newNames.length;
    for (applyObjectCounter; applyObjectCounter < applyObjectsNum; applyObjectCounter++) {
        applyWithOperation[aggregateOp[applyObjectCounter]]=aggregateProp[applyObjectCounter];
        applyWithName[newNames[applyObjectCounter]]=applyWithOperation;
        applyObjects.push(applyWithName);
    }
    transObject["APPLY"]=applyObjects;
    query["TRANSFORMATIONS"] = transObject;
    return query;

}

