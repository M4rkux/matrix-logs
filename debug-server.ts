Bun.serve({
  port: 3000,
  routes: {
    "/log": {
      POST: async (req) => {
        const body = await req.text();
        try {
          const parsed = JSON.parse(body);
          console.log(parsed);
        } catch (e) {
          console.log(body);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});

console.log("Debug server listening on http://localhost:3000");
