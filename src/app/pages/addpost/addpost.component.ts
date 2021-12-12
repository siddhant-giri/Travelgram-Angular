import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

//uuid
import {v4 as uuid} from "uuid";

//service
import { AuthService } from 'src/app/services/auth.service';

import {finalize} from "rxjs/operators";

//Angular form
import { NgForm } from '@angular/forms';

//Firebase
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireDatabase} from "@angular/fire/database";

//browser image resizer
import { readAndCompressImage } from 'browser-image-resizer';
import { imageConfig } from 'src/utils/config';

@Component({
  selector: 'app-addpost',
  templateUrl: './addpost.component.html',
  styleUrls: ['./addpost.component.css']
})
export class AddpostComponent implements OnInit {

  locationName: string;
  description : string;
  picture : string = null;

  user = null;
  uploadPercent : number = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private toastr: ToastrService
  ) { 
    auth.getUser().subscribe((user) => {
      this.db.object(`/users/${user.uid}`)
      .valueChanges()
      .subscribe((user) => {
        this.user = user;
      })
    })
  }

  ngOnInit(): void {
  }


  onSubmit(){
    const uid = uuid();
    this.db.object(`/posts/${uid}`)
    .set({
      id:uid,
      locationName : this.locationName,
      description : this.description,
      picture : this.picture,
      by : this.user.name,
      instaId : this.user.instaUserName,
      date : Date.now()
    })
    .then(() => {
      this.toastr.success("Successfully Posted")
    })
    .catch((err) => 
    {
      this.toastr.error("Oops")
    })
  }

async uploadFile(event){
  const file = event.target.files[0];
  let resizedImage = await readAndCompressImage(file, imageConfig);
  const filePath = file.name;
  const fileRef = this.storage.ref(filePath);

  const task = this.storage.upload(filePath, resizedImage);

  task.percentageChanges().subscribe((percentage) => {
    this.uploadPercent = percentage;
  })

  task.snapshotChanges()
  .pipe(
    finalize(() => {
      fileRef.getDownloadURL().subscribe((url) => {
        this.picture = url;
        this.toastr.success("Image upload success")
      })
    })
  )
  .subscribe()
}

}
