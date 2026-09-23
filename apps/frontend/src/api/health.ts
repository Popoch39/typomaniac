import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

export const healthQueryOptions = queryOptions({
  queryKey: ["health"],
  queryFn: async () => unwrap(await api.health.get()),
});
