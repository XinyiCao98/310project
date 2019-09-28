import Log from "../Util";

export default class QueryTree {
    public nodeType: string;
    public nodeProperty: string;
    public nodeValue: any;
    public children: QueryTree[];
    public Columns: string[];
    public Order: string;

    constructor() {
        this.nodeType = null;
        this.nodeProperty = null;
        this.nodeValue = null;
        this.children = null;
        this.Columns = null;
        this.Order = null;
    }

    // Build a Query Tree based on a Json File
    public buildQT(where: any, options: any): QueryTree {
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
           let Col = options["COLUMNS"];
           let ORDER = options["ORDER"];
           QT.Columns = Col;
           QT.Order = ORDER;
           return QT;
        }
        if (start === "AND" ||
           start === "NOT" ||
           start === "OR") {
            QT.nodeType = start;
            let m = where[start];
            Log.trace(m);
            return QT;
        }
        return QT;
    }
}
