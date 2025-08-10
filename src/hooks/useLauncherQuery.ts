import { useSearchParams } from "react-router-dom";
import type { LaunchParams } from "../lib/codec.ts";
import { decode, encode } from "../lib/codec.ts";
import useConfig from "@/hooks/useConfig.ts";

interface LauncherState
  extends Omit<Partial<LauncherQuery>, "launch">,
    LaunchParams {}

export interface LauncherQuery {
  launch_url: string;
  app_name: string;
  fhir_version: string;
  tab: string;
  launch: string;
  jwks_tab: string;
  validation?: string;
}

const LauncherQueryDefaults: LauncherQuery = {
  fhir_version: "r4",
  launch_url: "",
  app_name: "",
  tab: "0",
  launch: encode({
    launch_type: "provider-ehr",
    client_type: "public",
    pkce: "auto",
  }),
  jwks_tab: "0",
  validation: "0",
};

export function getLaunchParamsFromSearchParams(searchParams: URLSearchParams): LaunchParams {
  const launch = searchParams.get("launch");
  return launch ? (decode(launch) as LaunchParams) : {} as LaunchParams;
}

export function setLaunchParamsToSearchParams(
    searchParams: URLSearchParams,
    launch: LaunchParams
) {
  searchParams.set("launch", encode(launch));
}

export function setQuery(
    searchParams: URLSearchParams,
    setSearchParams: (params: URLSearchParams) => void,
    props: Partial<LaunchParams & Record<string, any>>
) {
  const launch = getLaunchParamsFromSearchParams(searchParams);

  for (const name in props) {
    const value = props[name as keyof typeof props];

    if (name in launch) {
      if (value === undefined) {
        delete launch[name as keyof LaunchParams];
      } else {
        (launch[name as keyof LaunchParams] as any) = value;
      }
    } else {
      if (value === undefined) {
        searchParams.delete(name);
      } else {
        searchParams.set(name, value + "");
      }
    }
  }

  setLaunchParamsToSearchParams(searchParams, launch);
  setSearchParams(searchParams);
}

/**
 * Uses the query string to store the state of the launcher page
 */
export default function useLauncherQuery(
  initialState: Partial<LauncherQuery> = {}
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { authRequired } = useConfig();

  const query: LauncherQuery = {
    ...LauncherQueryDefaults,
    ...initialState,
  };

  searchParams.forEach((value, key) => {
    query[key as keyof LauncherQuery] = value;
  });

  // Properties that belong to the launch parameters are encoded into a
  // `launch` parameter. Everything else is store as normal query parameter.
  // `undefined` can be used to remove launch or query parameters.
  function setQueryWrapped(props: Partial<LauncherState>) {
    return setQuery(searchParams, setSearchParams, props);
  }

  if(authRequired){

    // authentication is required, so there's no guarantee that the launch parameter is encoded as a JSON payload
    // instead we need to exit early and redirect to the AuthCallback
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return { query, launch: {} as LaunchParams, setQuery: setQueryWrapped };
  } else {
    const launch: LaunchParams = decode(query.launch) as LaunchParams;
    return { query, launch, setQuery: setQueryWrapped };
  }
}
