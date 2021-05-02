import { userMock } from "./user.mock";
import { books as BooksModel } from "../app/model/books";
import sinon from "sinon";
import lambdaTester from "lambda-tester";
import { expect } from "chai";
import { create } from "../user/create";

describe("Create [POST]", () => {
  it("success", () => {
    const s = sinon.mock(BooksModel);

    s.expects("create").resolves(userMock);

    return lambdaTester(create)
      .event({
        body: JSON.stringify({
          id: "123456789",
          email: "test@test.com",
          name: "john",
          surname: "doe",
          createdAt: "2020-05-04T11:53:34.056Z",
          updatedAt: "2020-05-04T11:53:34.056Z",
        }),
      })
      .expectResult((result: any) => {
        expect(result.statusCode).to.equal(200);
        const body = JSON.parse(result.body);
        expect(body.code).to.equal(0);
        s.restore();
      });
  });

  it("error", () => {
    const s = sinon.mock(BooksModel);

    s.expects("create").rejects(
      "E11000 duplicate key error collection: id_1 dup key: { id: 123456789 }"
    );

    return lambdaTester(create)
      .event({
        body: JSON.stringify({
          id: "123456789",
          email: "test@test.com",
          name: "john",
          surname: "doe",
          createdAt: "2020-05-04T11:53:34.056Z",
          updatedAt: "2020-05-04T11:53:34.056Z",
        }),
      })
      .expectResult((result: any) => {
        expect(result.statusCode).to.equal(200);
        const body = JSON.parse(result.body);
        expect(body.code).to.equal(1000);
        s.restore();
      });
  });
});
