import Log from "../Util";

export default class QueryTree {
    public nodeType: string;
    public nodeProperty: string;
    public nodeValue: any;
    public children: QueryTree[];
    public Columns: string[];
    public Order: string | object;
    public  Group: any;
    public  Apply: any;
    constructor() {
        this.nodeType = null;
        this.nodeProperty = null;
        this.nodeValue = null;
        this.children = [];
        this.Columns = null;
        this.Order = null;
        this.Group = null;
        this.Apply = null;
    }

    // Build a Query Tree based on a Json File
    public buildQT(query: any, trans: any): QueryTree {
        let where = query["WHERE"];
        let WhereChecker = Object.keys(where).length;
        let Col = query["OPTIONS"]["COLUMNS"];
        let ORDER = query["OPTIONS"]["ORDER"];
        let QT = new QueryTree();
        if ( trans !== "NO TRANSFORMATIONS") {
            QT.Group = trans["GROUP"];
            QT.Apply = trans["APPLY"];
        }
        if (WhereChecker === 0 ) {
            QT.nodeType = "emptyWhere";
        } else {
        let start = Object.keys(where)[0];
        QT.nodeType = start;
        if (start === "IS" ||
            start === "GT" ||
            start === "LT" ||
            start === "EQ") {
           let Key = Object.keys(where[start]).toString();
           let Value = Object.values(where[start])[0];
           QT.nodeProperty = Key;
           QT.nodeValue    = Value;
           QT.Columns = Col;
           QT.Order = ORDER;
           return QT;
        }
        if (start === "AND" ||
           start === "OR") {
            let m = where[start].length;
            let i = 0;
            for ( i; i < m; i++) {
                let Qt = new QueryTree();
                let Qtree = Qt.buildQTC(where[start][i]);
                QT.children.push(Qtree);
            }
            QT.Columns = Col;
            QT.Order = ORDER;
            return QT;

        }
        if (start === "NOT") {
        let Qt = new QueryTree();
        let C = Qt.buildQTC(where[start]);
        QT.children.push(C);
    }
        }
        QT.Columns = Col;
        QT.Order = ORDER;
        return QT;
    }

    public buildQTC(where: any): QueryTree {
        let start = Object.keys(where)[0];
        let QT = new QueryTree();
        if (start === "IS" ||
            start === "GT" ||
            start === "LT" ||
            start === "EQ") {
            QT.nodeType = start;
            let ItemsInside = where[start];
            let Key = Object.keys(ItemsInside).toString();
            let Value = Object.values(ItemsInside)[0];
            QT.nodeProperty = Key;
            QT.nodeValue    = Value;
            return QT;
        }
        if (start === "AND" ||
            start === "OR") {
            QT.nodeType = start;
            let m = where[start].length;
            for (let i: number = 0 ; i < m; i++) {
                let Qt = new QueryTree();
                let Qtree = Qt.buildQTC(where[start][i]);
                QT.children.push(Qtree);
            }
            return QT;
    }
        if (start === "NOT") {
            QT.nodeType = start;
            let Qt = new QueryTree();
            let C = Qt.buildQTC(where[start]);
            QT.children.push(C);
            return QT;
        }
}
}
