import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`HireOS backend listening on http://localhost:${env.PORT}/api/${env.API_VERSION}`);
});
