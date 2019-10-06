import {createInterface} from "readline";
import QueryTree from "./QueryTree";
import Log from "../Util";

export default class PerformQuery {
    private properties: string[] = ["courses_dept", "courses_id", "courses_avg", "courses_title",
        "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year", "courses_instructor"];

    constructor() {
        //
    }

    public GetResult(courses: [], queryTree: QueryTree): object[] {
        let result: object[] = [];
        if (queryTree.nodeType === "AND" ||
            queryTree.nodeType === "OR" ||
            queryTree.nodeType === "NOT") {
            let logicResult = this.PerformLogic(queryTree.nodeType, courses, queryTree);
            result = logicResult;
            return result;

        }
        if (queryTree.nodeType === "IS") {
            let key = queryTree.nodeProperty;
            let value = queryTree.nodeValue;
            result = this.PerformIS(key, value, courses);
        }
        if (queryTree.nodeType === "EQ") {
            let key = queryTree.nodeProperty;
            let value = queryTree.nodeValue;
            result = this.PerformEQ(key, value, courses);
        }
        if (queryTree.nodeType === "GT") {
            let key = queryTree.nodeProperty;
            let value = queryTree.nodeValue;
            result = this.PerformGT(key, value, courses);
        }
        if (queryTree.nodeType === "LT") {
            let key = queryTree.nodeProperty;
            let value = queryTree.nodeValue;
            result = this.PerformLT(key, value, courses);
        }
        return result;
    }

    public PerformLogic(LP: string, courses: [], queryTree: QueryTree) {
        if (LP === "AND") {
            let children = queryTree.children;
            let m = children.length;
            let start = children[0];
            let i = 1;
            let initial = this.GetResult(courses, start);
            let c = queryTree.children;
            for (i; i < m; i++) {
                let anotherT = children[i];
                let anotherR = this.GetResult(courses, anotherT);
                let UP = "courses_uuid";
                let intersection = this.FindIntersection(initial, anotherR, UP);
                // Log.trace(intersection.length);
                initial = intersection;
            }

            return initial;
        }
        if (LP === "OR") {
            let children = queryTree.children;
            let m = children.length;
            let start = children[0];
            let i = 1;
            let initial = this.GetResult(courses, start);
            for (i; i < m; i++) {
                let anotherT = children[i];
                let anotherR = this.GetResult(courses, anotherT);
                let UP = "courses_uuid";
                let union = this.FindUnion(initial, anotherR, UP);
                initial = union;
            }
            return initial;
        }
        if (LP === "NOT") {
            let children = queryTree.children;
            let start = children[0];
            let initial = this.GetResult(courses, start);
            let negation = this.FindNegation(initial, courses);
            return negation;
        }
    }

    public PerformIS(key: string, value: string, courses: []): object[] {
        let m = courses.length;
        let i = 0;
        let result: object[] = [];
        for (i; i < m; i++) {
            let element = courses[i];
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

    public PerformEQ(key: string, value: number, courses: []): object[] {
        let m = courses.length;
        let i = 0;
        let result: object[] = [];
        for (i; i < m; i++) {
            let element = courses[i];
            let ev = (element[key]);
            if (ev === value) {
                result.push(element);
            }

        }
        return result;

    }

    public PerformGT(key: string, value: number, courses: []): object[] {
        let m = courses.length;
        let i = 0;
        let result: object[] = [];
        for (i; i < m; i++) {
            let element = courses[i];
            let ev = (element[key]);
            if (ev > value) {
                result.push(element);
            }

        }
        return result;

    }

    public PerformLT(key: string, value: number, courses: []): object[] {
        let m = courses.length;
        let i = 0;
        let result: object[] = [];
        for (i; i < m; i++) {
            let element = courses[i];
            let ev = (element[key]);
            if (ev < value) {
                result.push(element);
            }

        }
        return result;

    }

    // Select the properties based on the given  columns
    public PerformColumns(selection: string[], Expected: object[]): object[] {
        let n = Expected.length;
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
    public SortbyNP(Expected: object[], Property: string): object[] {
        let cfirst: { [key: string]: any };
        let csecond: { [key: string]: any };
        Expected.sort((cone, ctwo) => {
            cfirst = cone;
            csecond = ctwo;
            if (cfirst[Property] > csecond[Property]) {
                return 1;
            }
            if (cfirst[Property] < csecond [Property]) {
                return -1;
            }
            return 0;
        });
        return Expected;
    }

    // Find Intersection of two array of objects
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

    // Find Union of two array of objects
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

    // Find Negation of two array of objects
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
