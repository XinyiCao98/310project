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

    //Find Where
    let conditionsFrame = document.getElementsByClassName("form-group conditions")[0];
    let conditions   = conditionsFrame.getElementsByClassName("conditions-container")[0];
    let filters    = conditions.getElementsByClassName("control-group condition");
    let firstFilter = filters[0];
    //read conditions
    let applyProperty = firstFilter.getElementsByClassName("control fields")[0];
    let getOptions = applyProperty.getElementsByTagName("select")[0];
    // selected is a string indicates the property applied in each conditions eg. avg/dept
    let selected = getOptions.options[getOptions.selectedIndex].value;

    let applyOperator = firstFilter.getElementsByClassName("control operators")[0];
    let operators = applyOperator.getElementsByTagName("select")[0];
    // operation is a string indicates the operation applied in each condition eg.EQ GT
    let operation = operators.options[operators.selectedIndex].value;

    let applyInput = firstFilter.getElementsByClassName("control term")[0];
    let inputTag = applyInput.getElementsByTagName("input")[0];
    // typed is a string entered manually
    let typed = inputTag["value"];

    //Find Columns
     let col = document.getElementsByClassName("control-group")[2];
     let colProperties = col.getElementsByClassName("control field");
     let  input = colProperties[0].getElementsByTagName("input") ;
     let columns = [];
     for (let colProperty of colProperties){
        input  = colProperty.getElementsByTagName("input")[0];
        if(input.getAttributeNames().length > 4){
           columns.push(input.attributes[2].nodeValue);
        }
     }

     // query["WHERE"]= typed; for testing
    return query;


}

