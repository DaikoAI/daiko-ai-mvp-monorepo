import { auth } from "@/server/auth";

export default auth((req) => {
  console.log("middleware", req.nextUrl.pathname);
});
