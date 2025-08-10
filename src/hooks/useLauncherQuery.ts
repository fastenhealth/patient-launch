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

const launcherSessionStoragePrefix = "launcher-state";


// populate LaunchParams from sessionStorage.
// It iterates through all keys in sessionStorage, filters those that match the launcherSessionStoragePrefix, and
// reconstructs a LaunchParams object.
function getLauncherStateFromSessionStorage<T extends Record<string, any>>(): T {
  const launcherState = Object.keys(sessionStorage)
      .filter((key) => key.startsWith(`${launcherSessionStoragePrefix}.`))
      .reduce((acc, key) => {
        const launchKey = key.replace(`${launcherSessionStoragePrefix}.`, "") as keyof T;
        acc[launchKey] = JSON.parse(sessionStorage.getItem(key) || "null") as T[keyof T];
        return acc;
      }, {} as T);

  console.log("getLauncherStateFromSessionStorage", launcherState);
  return launcherState
}

//saveLauncherStateToSessionStorage
function setQuery(props: Partial<LauncherState>) {
  const launch = getLauncherStateFromSessionStorage<LaunchParams>();

  for (const name in props) {
    const value = props[name as keyof LauncherState];

    if (name in launch) {
      if (value === undefined) {
        delete launch[name as keyof LaunchParams];
        sessionStorage.removeItem(`${launcherSessionStoragePrefix}.${name}`);
      } else {
        (launch[name as keyof LaunchParams] as any) = value;
        sessionStorage.setItem(
            `${launcherSessionStoragePrefix}.${name}`,
            JSON.stringify(value)
        );
      }
    } else {
      if (value === undefined) {
        sessionStorage.removeItem(`${name}`);
      } else {
        sessionStorage.setItem(name, JSON.stringify(value));
      }
    }
  }
  //
  // searchParams.set("launch", encode(launch));
  // setSearchParams(searchParams);
}

/**
 * Uses the query string to store the state of the launcher page
 */
export default function useLauncherQuery(
  initialState: Partial<LauncherQuery> = {}
) {
  const [searchParams] = useSearchParams();
  const { authRequired } = useConfig();

  const query: LauncherQuery = {
    ...LauncherQueryDefaults,
    ...initialState,
  };

  searchParams.forEach((value, key) => {
    query[key as keyof LauncherQuery] = value;
  });

// On initialization, reconstruct the `launcherState` object from sessionStorage


  if(authRequired){
    // authentication is required, so there's no guarantee that the launch parameter is encoded as a JSON payload
    // instead we need to exit early and redirect to the AuthCallback

    const launch: LaunchParams = getLauncherStateFromSessionStorage<LaunchParams>()

    return { query, launch, setQuery};
  } else {
    // authentication is not required, so we can safely decode the launch parameter
    // and set the query parameters from the sessionStorage
    //parse the querystring launch data, if it exists
    if(query.launch){
      setQuery(decode(query.launch));
    }
    const launch: LaunchParams = getLauncherStateFromSessionStorage<LaunchParams>()
    return { query, launch, setQuery };
  }


}
