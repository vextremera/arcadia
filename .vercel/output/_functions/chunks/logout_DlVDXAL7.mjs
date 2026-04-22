const POST = async ({
  session,
  redirect
}) => {
  if (!session) return new Response("Session not available", {
    status: 500
  });
  await session.delete("user");
  return redirect("/admin/login", 302);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
