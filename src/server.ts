import { app } from "@/app";

app.listen({ port: 3333, host: "0.0.0.0" }).then(() => {
	app.log.info("Server is running on port 3333!");
});
