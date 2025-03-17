import { Injectable } from "@angular/core";
import { LocalStoreService } from "../local-store.service";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { map, catchError, delay } from "rxjs/operators";
import { User } from "../../models/user.model";
import { of, BehaviorSubject, throwError } from "rxjs";
import { environment } from "environments/environment";

// ================= only for demo purpose ===========
const DEMO_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjhkNDc4MDc4NmM3MjE3MjBkYzU1NzMiLCJlbWFpbCI6InJhZmkuYm9ncmFAZ21haWwuY29tIiwicm9sZSI6IlNBIiwiYWN0aXZlIjp0cnVlLCJpYXQiOjE1ODc3MTc2NTgsImV4cCI6MTU4ODMyMjQ1OH0.dXw0ySun5ex98dOzTEk0lkmXJvxg3Qgz4ed";

 
// ================= you will get those data from server =======

@Injectable({
  providedIn: "root",
})
export class JwtAuthService {
  DEMO_USER :any= {
  };
  token;
  isAuthenticated: Boolean;
  user: User;
  user$ = (new BehaviorSubject<User>(this.user));
  signingIn: Boolean;
  JWT_TOKEN = "";
  APP_USER = "m3south_EGRET_USER";
  userType: any;
  secretKey: any;
  LocalData: any;

  constructor(
    private ls: LocalStoreService,
    private http: HttpClient,
    private router: Router
  ) {}

  public signin(username, password) {
    // return of({token: DEMO_TOKEN, user: DEMO_USER})
    //   .pipe(
    //     delay(1000),
    //     map((res: any) => {
    //       this.setUserAndToken(res.token, res.user, !!res);
    //       this.signingIn = false;
    //       return res;
    //     }),
    //     catchError((error) => {
    //       return throwError(error);
    //     })
    //   );

    // FOLLOWING CODE SENDS SIGNIN REQUEST TO SERVER

    this.signingIn = true;
    return this.http.post(environment.API_URL+'user/login.php', { username, password })
      .pipe(
        map((res: any) => {
          // debugger
          if(res["status"]==false)
          {
            this.signingIn = false;
           return res;
          }
          var user={
            id: res["id"],
            displayName: res["username"],
            role: res["userType"],
            typeId:res["typeId"]
          };
          this.DEMO_USER=user;
          this.JWT_TOKEN=res["userType"]
          this.setUserAndToken(user, !!res);
          this.signingIn = false;
          return res;
        }),
        catchError((error) => {
          return throwError(error);
        })
      );
  }

  /*
    checkTokenIsValid is called inside constructor of
    shared/components/layouts/admin-layout/admin-layout.component.ts
  */
  public checkTokenIsValid() {
    
    return of(this.DEMO_USER)
      .pipe(
        map((profile: User) => {
          this.setUserAndToken(profile, true);
          this.signingIn = false;
          return profile;
        }),
        catchError((error) => {
          return of(error);
        })
      );
    
    /*
      The following code get user data and jwt token is assigned to
      Request header using token.interceptor
      This checks if the existing token is valid when app is reloaded
    */

    // return this.http.get(`${environment.apiURL}/api/users/profile`)
    //   .pipe(
    //     map((profile: User) => {
    //       this.setUserAndToken(this.getJwtToken(), profile, true);
    //       return profile;
    //     }),
    //     catchError((error) => {
    //       return of(error);
    //     })
    //   );
  }

  public signout() {
    this.setUserAndToken(null, false);
    // this.ls.setItem("JWT_TOKEN", null);
    localStorage.removeItem('m3south_EGRET_USER');
    localStorage.removeItem('m3south_JWT_TOKEN');
    localStorage.removeItem('m3south_UserType');
    localStorage.removeItem('m3south_secretkey');
    this.router.navigateByUrl("sessions/signin");
  }

  isLoggedIn(): Boolean {
    return !!this.getJwtToken();
    //return true;
  }

  getJwtToken() {
    return this.ls.getItem("m3south_JWT_TOKEN");
  }
  getUser() {
    return this.ls.getItem(this.APP_USER);
  }

  // setUserAndToken(token: String, user: User, isAuthenticated: Boolean) {
  //   this.isAuthenticated = isAuthenticated;
  //   this.token = token;
  //   this.user = user;
  //   this.user$.next(user);
  //   this.ls.setItem(this.JWT_TOKEN, token);
  //   this.ls.setItem(this.APP_USER, user);
  // }

  setUserAndToken(user, isAuthenticated: Boolean) {
    this.isAuthenticated = isAuthenticated;
    
    this.user = user;
    this.user$.next(user);
    this.ls.setItem("m3south_JWT_TOKEN", this.JWT_TOKEN);
    this.ls.setItem(this.APP_USER, user);
  }
  getLocalData(userType,secretKey) {
    // console.log('jwtauth....', userType, secretKey);
    this.userType = userType;
    this.secretKey = secretKey;
  }

  accessData() {
    // console.log('jwtaccess......', this.userType, this.secretKey);
    this.LocalData = {
      userType : this.userType,
      secretKey : this.secretKey
    };
    return this.LocalData;
  }
}
