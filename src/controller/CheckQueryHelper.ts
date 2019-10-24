import Log from "../Util";
import QueryTree from "./QueryTree";
import {CheckTransformationHelper} from "./CheckTransformationHelper";

export class CheckQueryHelper {
    private properties: string[] = ["dept", "id", "avg", "title",
        "pass", "fail", "audit", "uuid", "year", "instructor", "lat", "lon", "seats", "fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href"];

    private CNProperties: string[] = ["avg", "pass", "fail", "audit", "year"];
    private CSProperties: string[] = ["dept", "id", "instructor", "title", "uuid"];
    private RNProperties: string[] = ["lat", "lon", "seats"];
    private RSProperties: string[] = ["fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href"];

    private RP: string[] = ["lat", "lon", "seats", "fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href"];

    private CP: string[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
    private ValidKeyinQ: string[] = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
    private tempID: string;
    private keyInOrder: string[] = ["keys", "dir"];
    private keyInDir: string[] = ["UP", "DOWN"];

    constructor() {
        //
    }

    // type refers to the datatype false for courses true for room
    public CheckQuery(query: any): boolean {
        if (!this.BasicCheck(query)) {
            return false;
        }
        let where = query["WHERE"];
        let options = query["OPTIONS"];
        if (!options.hasOwnProperty("COLUMNS") || !Array.isArray(options["COLUMNS"])) {
            return false;
        }
        for (const item of options["COLUMNS"]) {
            if (typeof item !== "string") {
                return false;
            }
        }
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            let trans = query["TRANSFORMATIONS"];
            if (Object.keys(trans).length !== 2 || !trans.hasOwnProperty("APPLY") || !trans.hasOwnProperty("GROUP")) {
                return false;
            }
        }
        let filtered = this.ElementInColFiltered(query);
        try {
            this.tempID = (filtered[0]).split("_")[0];
        } catch (e) {
            return false;
        }
        let determineType = (filtered[0]).split("_")[1];
        let type: boolean = false;
        if (this.properties.indexOf(determineType) < 0) {
            return false;
        }
        if (this.RP.indexOf(determineType) > 0) {
            type = true;
        }
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            const TransHelper = new CheckTransformationHelper();
            let trans = query["TRANSFORMATIONS"];
            if (!TransHelper.checkTrans(trans, options, type)) {
                return false;
            }
        }

// columns exists plus it is an array
        if (! this.CheckOptions(options, type, filtered)) {
            return false;
        }
        if (!this.checkWhere(where, type)) {
            return false;
        }
        return true;
}

    public checkWhere(where: any, Type: boolean): boolean {
        if (Object.keys(where).length === 0) {
            return true;
        }
        let Comparator = Object.keys(where)[0];
        let itemsInCom = where[Comparator];
        if (Comparator === "EQ" || Comparator === "GT" || Comparator === "LT") {
            return this.CheckCWL(itemsInCom, Type);
        } else if (Comparator === "IS") {
            return this.CheckIWL(itemsInCom, Type);
        } else if (Comparator === "AND" || Comparator === "OR") {
            return this.CheckL(itemsInCom, Type);
        } else if (Comparator === "NOT") {
            return this.CheckNeg(itemsInCom, Type);
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
    public CheckCol(Filtered: string[], Type: boolean): boolean {
        let standard = this.CP;
        if (Type === true) {
            standard = this.RP;
        }
        let i: number = 0;
        if (Filtered.length > 0) {
            for (i; i < Filtered.length; i++) {
                let pre = Filtered[i].split("_")[0];
                let val = Filtered[i].split("_")[1];
                if (standard.indexOf(val) < 0 || pre !== this.tempID) {
                    return false;
                 }
            }
            return true;
        }
    }

    public CheckOrd(Col: string[], Ord: any): boolean { // Check if element inside order is valid
        if (Col === null ) {
            return false;
        }
        if (typeof Ord === "string") {
            if (Col.indexOf(Ord) < 0) {
                return false;
            }
            return true;
        }
        if (typeof Ord === "object") {
         if (Object.keys(Ord).length !== 2) {
         return false;
         }
         let keyOne = Object.keys(Ord)[0];
         let keyTwo = Object.keys(Ord)[1];
         if (keyOne === keyTwo || this.keyInOrder.indexOf(keyOne) < 0 ||
          this.keyInOrder.indexOf(keyTwo) < 0) {
             return false;
         }
         let vOne = Ord["keys"];
         let vTwo = Ord["dir"];
         if (this.keyInDir.indexOf(vTwo) < 0 || vOne === null ||
             typeof vOne !== "object" || Object.keys(vOne).length < 1) {
             return false;
         }
         let OrderKeys: string[] = Object.values(vOne);
         for (let KIO of OrderKeys) {
             if (Col.indexOf(KIO) < 0) {
                 return false;
             }
         }
         return true;
        }
        return false;
    }

    // Check Compare Statement without logic
    public CheckCWL(ItemInComparator: any, Type: boolean): boolean {
        if (!this.queryOrNot(ItemInComparator) || Object.keys(ItemInComparator).length !== 1) {
            return false;
        }
        let standardN =  this.CNProperties;
        if (Type === true) {
            standardN = this.RNProperties;
        }
        let pre = Object.keys(ItemInComparator).toString().split("_")[0];
        let Key = Object.keys(ItemInComparator).toString().split("_")[1];
        let Values = Object.values(ItemInComparator)[0];

        if (standardN.indexOf(Key) < 0 || pre !== this.tempID) {
            return false;
        }
        if (typeof Values !== "number") {
            return false;
        }
        return true;
    }

    public CheckIWL(ItemInComparator: any, Type: boolean): boolean { // Check IS Statement without logic
        if (!this.queryOrNot(ItemInComparator) || Object.keys(ItemInComparator).length !== 1) {
            return false;
        }
        let standardS = this.CSProperties;
        if (Type === true) {
            standardS = this.RSProperties;
        }
        let pre = Object.keys(ItemInComparator).toString().split("_")[0];
        let Key = Object.keys(ItemInComparator).toString().split("_")[1];
        let Values = Object.values(ItemInComparator)[0];
        if (standardS.indexOf(Key) < 0 || pre !== this.tempID) {
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

    public CheckL(ItemInComparator: any, Type: boolean): boolean { // check AND || OR logic
        if (ItemInComparator === null || !Array.isArray(ItemInComparator) || ItemInComparator.length < 1) {
            return false;
        } else {
            for (let everyLogic of ItemInComparator) {
                if (everyLogic === null) {
                    return false;
                }
                if (!this.checkWhere(everyLogic, Type) || Object.keys(everyLogic).length !== 1) {
                    return false;
                }
            }
            return true;
        }
    }

    public CheckNeg(ItemInComparator: any, Type: boolean): boolean { // check AND || OR logic
        if (!this.queryOrNot(ItemInComparator) || Object.keys(ItemInComparator).length !== 1) {
            return false;
        } else {
            return this.checkWhere(ItemInComparator, Type);
        }
    }

    public BasicCheck(query: any): boolean {
        if (query === null || !this.queryOrNot(query) ||
            !query.hasOwnProperty("WHERE") || !query.hasOwnProperty("OPTIONS") ||
            !this.queryOrNot(query["WHERE"]) || !this.queryOrNot(query["OPTIONS"]) || // first layer has be queries
            Object.keys(query).length < 2 ||  Object.keys(query["OPTIONS"]).length > 3 || // edited for D2
            Object.keys(query["OPTIONS"]).length === 0 || Object.keys(query["WHERE"]).length > 1) {
            return false;
        }
        let keys = Object.keys(query);
        for (let key of keys) {
            if (this.ValidKeyinQ.indexOf(key) < 0) {
                return false;
            }
        }
        return true;
    }

    // Take the element from Columns without those created in APPLY
    public ElementInColFiltered(query: any): string[] {
        let ECF: string[] = [];
        let ElementsInCol = query["OPTIONS"]["COLUMNS"];
        const TransHelper = new CheckTransformationHelper();
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
        let trans = query["TRANSFORMATIONS"];
        let NewElement = TransHelper.getNew(trans["APPLY"]);
        for (let Eu of ElementsInCol) {
            if (NewElement.indexOf(Eu) < 0) {
                ECF.push(Eu);
            }
        }
        return ECF;
    } else {
        return ElementsInCol;
}
    }

    // Check the part in Columns is valid or NOT
    public CheckOptions(options: any, Type: boolean, Filtered: string[]): boolean {
        let itemsInCOL = options["COLUMNS"];
        for (const key of Object.keys(options)) { // check options has valid elements
            if (key === "COLUMNS") {
                if (!this.CheckCol(Filtered, Type)) {
                    return false;
                }
            } else if (key === "ORDER" ) {
                if (!this.CheckOrd(itemsInCOL, options["ORDER"])) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

}
