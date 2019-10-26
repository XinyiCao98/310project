import Log from "../Util";
import {split} from "ts-node";

export class CheckTransformationHelper {
    private OperationNames: string[] = ["MAX", "MIN", "AVG", "SUM", "COUNT"];
    private NumericOperations: string[] = ["MAX", "MIN", "AVG", "SUM"];

    private CNProperties: string[] = ["avg", "pass", "fail", "audit", "year"];
    private RNProperties: string[] = ["lat", "lon", "seats"];

    private CProperties: string[] = ["avg", "pass", "fail", "audit", "year",
        "dept", "id", "instructor", "title", "uuid"];

    private RProperties: string[] = ["lat", "lon", "seats", "fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href"];

    constructor() {
        //
    }

    public checkTrans(trans: any, options: any, Type: boolean): boolean {
        if (!trans.hasOwnProperty("APPLY") || !trans.hasOwnProperty("GROUP")) {
            return false;
        }
        let apply = trans["APPLY"];
        if (!this.checkApply(apply, Type)) {
            return false;
        }
        if (!this.checkElement(trans, options)) {
            return false;
        }
        this.getNew(apply);
        return true;
    }

    public checkElement(trans: any, options: any): boolean {
        let Col = options["COLUMNS"];
        if (!options.hasOwnProperty("COLUMNS") || !Array.isArray(Col)) {
            return false;
        }
        let Group = trans["GROUP"];
        if (!Array.isArray(Group)) { // typeof Group !== "string" &&
            return false;
        }
        let EleInTrans = this.ObtainKeys(trans);
        let p = Object.keys(Col).length;
        for (let l: number = 0; l < p; l++) {
            if (!EleInTrans.includes(Col[l])) {
                return false;
            }
        }
        return true;
    }

    // get all keys inside transformation
    public ObtainKeys(trans: any): string[] {
        let EleInT: string[] = [];
        let G = trans["GROUP"];
        let A = trans["APPLY"];
        let m = Object.keys(G).length;
        let n = Object.keys(A).length;
        if (typeof G === "string") {
            EleInT.push(G);
        } else {
            for (let i: number = 0; i < m; i++) {
                EleInT.push(G[i]);
            }
        }
        for (let k: number = 0; k < n; k++) {
            EleInT.push(Object.keys(A[k])[0]);
        }
        return EleInT;
    }

    // Check Elements inside Apply
    public checkApply(apply: any, Type: boolean): boolean {
        if (!Array.isArray(apply)) {
            return false;
        }
        let standardP = this.CProperties;
        let standardNP = this.CNProperties;
        if (Type === true) {
            standardP = this.RProperties;
            standardNP = this.RNProperties;
        }
        for (let element of apply) {
            let key = Object.keys(element);
            if (Object.keys(key).length !== 1) {
                return false;
            }
            let realKey = key[0];
            if (typeof (realKey) !== "string") {
                return false;
            }
            let value = Object.values(element)[0];
            let operation = Object.keys(value)[0];
            if (Object.keys(operation).length !== 1) {
                return false;
            }
            if (this.OperationNames.indexOf(operation) < 0) {
                return false;
            }
            let operationObject = Object.values(value)[0];
            if (typeof operationObject !== "string") {
                return false;
            }
            let property = operationObject.split("_")[1];
            if (standardP.indexOf(property) < 0) {
                return false;
            }
            if (this.NumericOperations.indexOf(operation) > 0) {
                if (standardNP.indexOf(property) < 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Take the names of the new elements created in APPLY
    public getNew(apply: any): string[] {
        let New: string[] = [];
        let values = Object.values(apply);
        for (let newP of values) {
            New.push(Object.keys(newP)[0]);
        }
        return New;
    }
}
