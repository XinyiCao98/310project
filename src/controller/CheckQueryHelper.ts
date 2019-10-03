import Log from "../Util";
import QueryTree from "./QueryTree";

export class CheckQueryHelper {
    private properties: string[] = ["courses_dept", "courses_id", "courses_avg", "courses_title",
        "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year", "courses_instructor"];
    private NProperties: string[] = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year"];
    private SProperties: string[] = ["courses_dept", "courses_id",
        "courses_instructor", "courses_title", "courses_uuid"];

    constructor() {
        //
    }

    public CheckQuery(query: any): boolean { // check basic element exists
        if (query === null || !this.queryOrNot(query) ||
            !query.hasOwnProperty("WHERE") || !query.hasOwnProperty("OPTIONS") ||
            !this.queryOrNot(query["WHERE"]) || !this.queryOrNot(query["OPTIONS"]) || // first layer has be queries
            Object.keys(query).length !== 2 || Object.keys(query["OPTIONS"]).length > 2 ||
            Object.keys(query["OPTIONS"]).length === 0 || Object.keys(query["WHERE"]).length > 2) {
            return false;
        }
        let where = query["WHERE"];
        let options = query["OPTIONS"];
        // Log.trace(itemsInCom);
        if (!this.checkWhere(where)) { return false; }
        if (!options.hasOwnProperty("COLUMNS") || !Array.isArray(options["COLUMNS"])) {
            return false;
        } // columns exists plus it is an array
        for (const item of options["COLUMNS"]) {
            if (typeof item !== "string") { return false; }
        } // every element inside columns are string
        let itemsInCOL: string[] = options["COLUMNS"]; // stuff inside columns
        for (const key of Object.keys(options)) { // check options has valid elements
            if (key === "COLUMNS") {
                if (!this.CheckCol(itemsInCOL)) {
                    return false;
                }
            } else if (key === "ORDER" && !Array.isArray(options["ORDER"]) && typeof options["ORDER"] === "string") {
                if (!this.CheckOrd(itemsInCOL, options["ORDER"])) {
                    return false;
                }
            } else {
                return false; // if contains more than col/order, return false
            }
        }

        return true;
    }

    public checkWhere(where: any): boolean {
        if (Object.keys(where).length === 0) {
            return true;
        }
        let Comparator = Object.keys(where)[0];
        let itemsInCom = where[Comparator];
        if (Comparator === "EQ" || Comparator === "GT" || Comparator === "LT") {
            return this.CheckCWL(itemsInCom);
        } else if (Comparator === "IS") {
            return this.CheckIWL(itemsInCom);
        } else if (Comparator === "AND" || Comparator === "OR") {
            return this.CheckL(itemsInCom);
        } else if (Comparator === "NOT") {
            return this.CheckNeg(itemsInCom);
        } else {
            return false;
        }
        return true;
    }

    // Check if input is a query e.g. {}
    public queryOrNot(q: any): boolean {
        if (typeof q === "string" || typeof q === "number" ||
            Array.isArray(q) || q === null) {
            return false;
        }
        return true;
    }

    // Check the properties from Column are in given information or not
    public CheckCol(Col: string[]): boolean {
        let i: number = 0;
        if (Col.length > 0) {
            for (i; i < Col.length; i++) {
                if (this.properties.indexOf(Col[i]) < 0) {
                    return false;
                }
            }
            return true;
        }
    }

    public CheckOrd(Col: string[], Ord: string): boolean { // Check if element inside order is valid
        if (Col === null || Col.indexOf(Ord) < 0) {
            return false;
        } else {
            return true;
        }
    }

    // Check Compare Statement without logic
    public CheckCWL(ItemInComparator: any): boolean {
        if (!this.queryOrNot(ItemInComparator) || Object.keys(ItemInComparator).length !== 1) {
            return false;
        }
        let Key = Object.keys(ItemInComparator).toString();
        let Values = Object.values(ItemInComparator)[0];

        if (this.NProperties.indexOf(Key) < 0) {
            return false;
        }
        if (typeof Values !== "number") {
            return false;
        }
        return true;
    }

    public CheckIWL(ItemInComparator: any): boolean { // Check IS Statement without logic
        if (!this.queryOrNot(ItemInComparator) || Object.keys(ItemInComparator).length !== 1) {
            return false;
        }
        let Key = Object.keys(ItemInComparator).toString();
        let Values = Object.values(ItemInComparator)[0];
        if (this.SProperties.indexOf(Key) < 0) {
            return false;
        }
        if (typeof Values !== "string") {
            return false;
        }
        let pattern = /^((\*)?[^*]*(\*)?)$/;
        if (!pattern.test(Values)) {
            return false;
        }
        return true;
    }

    public CheckL(ItemInComparator: any): boolean { // check AND || OR logic
        if (ItemInComparator === null || !Array.isArray(ItemInComparator) || ItemInComparator.length < 1) {
            return false;
        } else {
            for (let everyLogic of ItemInComparator) {
                if (!this.checkWhere(everyLogic) || Object.keys(everyLogic).length === 0) {
                    return false;
                }
            }
            return true;
        }
    }

    public CheckNeg(ItemInComparator: any): boolean { // check AND || OR logic
        if (!this.queryOrNot(ItemInComparator) || Object.keys(ItemInComparator).length !== 1) {
            return false;
        } else {
            return this.checkWhere(ItemInComparator);
        }
    }
}
