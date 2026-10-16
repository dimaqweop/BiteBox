import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import { passwordProfile, validateNewPassword } from "./passwordProfile";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile: passwordProfile,
      validatePasswordRequirements: validateNewPassword,
    }),
  ],
});
