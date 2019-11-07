import {createInterface} from "readline";
import QueryTree from "./QueryTree";
import Log from "../Util";
import {InsightDataset, InsightError} from "./IInsightFacade";
import {split} from "ts-node";
import PerformOrderHelper from "./PerformOrderHelper";
import CheckQueryHelper from "./CheckQueryHelper";
import CheckTransformationHelpe from "./CheckTransformationHelper";
export default class PerformQuery {
    public idStr: string;

    constructor(id: string) {
        this.idStr = id;
    }

    public GetResult(data: [], queryTree: QueryTree, query: any): any {
        let result: object[] = [];
        if (queryTree.nodeType === "emptyWhere") {
            return data;
        }
        if (queryTree.nodeType === "AND" ||
            queryTree.nodeType === "OR" ||
            queryTree.nodeType === "NOT") {
            let logicResult = this.PerformLogic(queryTree.nodeType, data, queryTree , query);
            if (logicResult === false) {
                return false;
            }
            result = logicResult;
            return result;

        }
        if (queryTree.nodeType === "IS") {
            let key = queryTree.nodeProperty;
            let value = queryTree.nodeValue;
            result = this.PerformIS(key, value, data);
        }
        if (queryTree.nodeType === "EQ") {
            let key = queryTree.nodeProperty;
            let value = queryTree.nodeValue;
            result = this.PerformEQ(key, value, data);
}
        if (queryTree.nodeType === "GT") {
            let key = queryTree.nodeProperty;
            let value = queryTree.nodeValue;
            result = this.PerformGT(key, value, data);
        }
        if (queryTree.nodeType === "LT") {
            let key = queryTree.nodeProperty;
            let value = queryTree.nodeValue;
            result = this.PerformLT(key, value, data);
        }
        return result;
    }

    public PerformLogic(LP: string, courses: [], queryTree: QueryTree, query: any): any {
        const CheckTH = new CheckTransformationHelpe();
        let uniqueID = CheckTH.findUniqueP(query);
        if (LP === "AND") {
            let children = queryTree.children;
            let start = children[0];
            let initial = this.GetResult(courses, start , query);
            for (let i: number = 1; i < children.length; i++) {
                let anotherT = children[i];
                let anotherR = this.GetResult(courses, anotherT, query);
                if (anotherR === false) {
                    return false;
                }
                let intersection = this.FindIntersection(initial, anotherR, this.idStr + uniqueID);
                initial = intersection;
            }
            return initial;
        }
        if (LP === "OR") {
            let children = queryTree.children;
            let m = children.length;
            let start = children[0];
            let i = 1;
            let initial = this.GetResult(courses, start , query);
            if (initial === false) {
                return false;
            }
            for (i; i < m; i++) {
                let anotherT = children[i];
                let anotherR = this.GetResult(courses, anotherT, query);
                if (anotherR === false) {
                    return false;
                }
                let union = this.FindUnion(initial, anotherR, this.idStr + uniqueID);
                initial = union;
            }
            return initial;
        }
        if (LP === "NOT") {
            let children = queryTree.children;
            let start = children[0];
            let initial = this.GetResult(courses, start , query);
            if (initial === false) {
                return false;
            }
            let negation = this.FindNegation(initial, courses);
            return negation;
        }
    }

    public PerformIS(key: string, value: string, Data: []): any {
        let m = Data.length;
        let result: object[] = [];
        for (let i: number = 0; i < m; i++) {
            let element = Data[i];
            let ev = String(element[key]);
            if (value === "*" || value === "**") {
                result.push(element);
            } else if (value.startsWith("*")) {
                if (value.endsWith("*")) {
                    if (ev.includes(value.substring(1, value.length - 1))) {
                        result.push(element);
                    }
                } else {
                    if (ev.endsWith(value.substring(1))) {
                        result.push(element);
                    }
                }
            } else if (value.endsWith("*")) {
                if (ev.startsWith(value.substring(0, value.length - 1))) {
                    result.push(element);
                }
            } else if (ev === value) {
                result.push(element);
            }
        }
        return result;
    }

    public PerformEQ(key: string, value: number, courses: []): any {
        let m = courses.length;
        // if (!this.checkID(key, this.idStr)) {
        //     return false;
        // }
        let result: object[] = [];
        for (let i: number = 0; i < m; i++) {
            let element = courses[i];
            let ev = (element[key]);
            if (ev === value) {
                result.push(element);
            }

        }
        return result;
    }

    public PerformGT(key: string, value: number, courses: []): any {
        let m = courses.length;
        let result: object[] = [];
        for (let i: number = 0; i < m; i++) {
            let element = courses[i];
            let ev = (element[key]);
            if (ev > value) {
                result.push(element);
            }
        }
        return result;

    }

    public PerformLT(key: string, value: number, courses: []): any {
        let m = courses.length;
        let result: object[] = [];
        for (let i: number = 0; i < m; i++) {
            let element = courses[i];
            let ev = (element[key]);
            if (ev < value) {
                result.push(element);
            }

        }
        return result;
    }

    public PerformColumns(selection: string[], Expected: object[]): any {
        let n = Expected.length;
        let m = selection.length;
        let i = 0;
        for (i; i < n; i++) {
            Expected[i] = this.Pick(Expected[i], selection);
        }
        return Expected;
    }

    // Pick the corresponding information from the object based on the given keys
    public Pick(course: object, keys: string[]): object {
        let picked: { [key: string]: any } = {};
        let cour: { [key: string]: any };
        cour = course;
        let m = keys.length;
        let i = 0;
        for (i; i < m; i++) {
            let selectedP = keys[i];
            picked[selectedP] = cour[selectedP];
        }
        return picked;

    }

    // Sort an array of objects by numerical properties
    public Order(Expected: object[], Property: string | object): any {
        const PQueryHelper = new PerformOrderHelper();
        if (typeof Property === "string") {
            return PQueryHelper.OrderByString(Expected, Property);

        } else {
            let keys: string[];
            let dir: string;
            let values = Object.values(Property);
            if (typeof values[1] === "string") {
                dir = values[1];
                keys = values[0];
            } else {
                dir = values[0];
                keys = values[1];
            }
            return PQueryHelper.OrderByObject(Expected, keys, dir);

        }
    }

    public FindIntersection(ArrayOne: object[], ArrayTwo: object[], UniqueProperty: string): object[] {
        let A: { [key: string]: any };
        let B: { [key: string]: any };
        let m = Object.keys(ArrayOne).length;
        let n = Object.keys(ArrayTwo).length;
        let intersection: object[] = [];
        for (let i: number = 0; i < m; i++) {
            A = ArrayOne[i];
            let same = false;
            for (let k: number = 0; k < n; k++) {
                B = ArrayTwo[k];
                if (B[UniqueProperty] === A[UniqueProperty]) {
                    same = true;
                    break;
                }
            }
            if (same === true) {
                intersection.push(A);
            }
        }
        return intersection;

    }

    public FindUnion(ArrayOne: object[], ArrayTwo: object[], UniqueProperty: string): object[] {
        let A: { [key: string]: any };
        let B: { [key: string]: any };
        let m = Object.keys(ArrayOne).length;
        let n = Object.keys(ArrayTwo).length;
        let union: object[] = [];
        for (let l: number = 0; l < m; l++) {
            A = ArrayOne[l];
            union.push(A);
        }
        for (let i: number = 0; i < n; i++) {
            B = ArrayTwo[i];
            let same = false;
            for (let k: number = 0; k < m; k++) {
                A = ArrayOne[k];
                if (B[UniqueProperty] === A[UniqueProperty]) {
                    same = true;
                    break;
                }
            }
            if (same !== true) {
                union.push(B);
            }
        }
        return union;

    }

    public FindNegation(ArrayOne: object[], courses: object[]): object[] {
        let negation: object[] = [];
        for (let item of courses) {
            if (!ArrayOne.includes(item)) {
                negation.push(item);
            }
        }
        return negation;
    }

}
