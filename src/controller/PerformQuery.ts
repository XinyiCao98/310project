import {createInterface} from "readline";

export default class PerformQuery {
    private NProperties: string[] = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year"];
    private SProperties: string[] = ["courses_dept", "courses_id",
        "courses_instructor", "courses_title", "courses_uuid"];
    private properties: string[] = ["courses_dept", "courses_id", "courses_avg", "courses_title",
        "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year", "courses_instructor"];
    constructor() {
        //
    }
    public PerformIS (key: string, value: string, courses: []): object[] {
        let m = courses.length;
        let i = 0;
        let result: object[] = [] ;
        for (i; i < m; i++) {
            let element = courses[i];
            let ev      = String(element[key]);
            if ( ev === value) {
                result.push(element);
            }
        }
        return result;

    }
    public PerformEQ (key: string, value: number, courses: []): object[] {
        let m = courses.length;
        let i = 0;
        let result: object[] = [] ;
        for (i; i < m; i++) {
            let element = courses[i];
            let ev      = (element[key]);
            if ( ev === value) {
                result.push(element);
            }

        }
        return result;

    }
    public PerformGT (key: string, value: number, courses: []): object[] {
        let m = courses.length;
        let i = 0;
        let result: object[] = [] ;
        for (i; i < m; i++) {
            let element = courses[i];
            let ev      = (element[key]);
            if ( ev > value) {
                result.push(element);
            }

        }
        return result;

    }
    public PerformLT (key: string, value: number, courses: []): object[] {
        let m = courses.length;
        let i = 0;
        let result: object[] = [] ;
        for (i; i < m; i++) {
            let element = courses[i];
            let ev      = (element[key]);
            if ( ev < value) {
                result.push(element);
            }

        }
        return result;

    }
    // Select the properties based on the given  columns
    public PerformColumns (selection: string[], Expected: object[]): object[] {
        let n = Expected.length;
        let i = 0;
        for (i; i < n; i++) {
            Expected[i] = this.Pick(Expected[i], selection);
        }
        return Expected; }
    // Pick the corresponding information from the object based on the given keys
    public Pick (course: object, keys: string[]): object {
         let picked: {[key: string]: any} = {};
         let cour: {[key: string]: any};
         cour = course;
         let m = keys.length;
         let i  = 0;
         for (i; i < m; i++) {
             let selectedP = keys[i];
             picked[selectedP] = cour[selectedP];

         }
         return picked;

    }
    // Sort an array of objects by numerical properties
     public SortbyNP (Expected: object[], Property: string): object[] {
        let cfirst: {[key: string]: any};
        let csecond: {[key: string]: any};
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
     } }
