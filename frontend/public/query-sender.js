/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        // TODO: implement!
        try {
            let req = new XMLHttpRequest();
            req.open("POST", 'http://localhost:4321/query', true);
            req.setRequestHeader("Content-Type", "application/json");

            try {
                req.onload = function () {
                    fulfill(req.response);
                };
                req.send(JSON.stringify(query));
            } catch (e) {
                reject(e);
            }
        } catch (e) {
            reject(e);
        }
    });
};
