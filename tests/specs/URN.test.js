var URN = require("URN");

describe("URN", function () {

    it("Exists", function () {
        expect(URN).toBeDefined();
    });

    it("Converts an array to a URN string", function () {
        var arr, res;
        arr = ["ctx1", "dvc1", "src1"],
        res = URN.stringify(arr);
        expect(res).toEqual("urn:ctx1:dvc1:src1");
    });

    it("Converts a URN string to array", function () {
        var str, res;
        str = "urn:ctx1:dvc1:src1";
        res = URN.parse(str);
        expect(res).toEqual(["ctx1", "dvc1", "src1"]);
    });

});