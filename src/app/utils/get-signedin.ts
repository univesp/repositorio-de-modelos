const isSignedIn = () => {
  let getIsSignedIn: any = localStorage.getItem('isSignedIn');
  let isSignedIn: boolean = false;

  getIsSignedIn === "false" ? isSignedIn = false : isSignedIn = true;

  return isSignedIn;
}

export { isSignedIn };