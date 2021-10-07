import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';

import { MatSnackBar } from '@angular/material/snack-bar';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { Subscription, forkJoin } from 'rxjs';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { UserService } from 'app/shared/services/user.service';
import { ListPopupComponent } from '../list-popup/list-popup.component';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { PrintDownloadOptions } from 'app/views/Models/PrintDownloadOptionsDto';
import * as moment from 'moment';
import { CopyRequestComponent } from '../copy-request/copy-request.component';
import { SubcontractorService } from 'app/shared/services/subcontractor.service';
import { RequestService } from 'app/shared/services/request.service';
import { StatusChangeDialogComponent } from '../status-change-dialog/status-change-dialog.component';
import { RequestSaveOptionsDialogComponent } from '../request-save-options-dialog/request-save-options-dialog.component';
import { DeleteOptionComponent } from 'app/views/Administrator/delete-option/delete-option.component';
import { SelectionType } from '@swimlane/ngx-datatable';
import { ActivityService } from 'app/shared/services/activity.service';
import { SearchRequestDto } from 'app/views/Models/SearchRequestDto';
import { DatePipe } from '@angular/common';
import { JwtAuthService } from 'app/shared/services/auth/jwt-auth.service';
import { RequestsbyId, RequestBySubcontractorId } from 'app/views/Models/RequestDto';
import * as xlsx from 'xlsx';
import { EditRequestComponent } from '../edit-request/edit-request.component';
import { config } from 'config';

@Component({
  selector: 'app-list-request',
  templateUrl: './list-request.component.html',
  styleUrls: ['./list-request.component.css'],
  animations: egretAnimations
})
export class ListRequestComponent implements OnInit {
  ModalOptions: PrintDownloadOptions;
  spinner = false;
  IsNotSubCntr:boolean=false;
  selected = [];
  selectedRequestIds = [];
  Filtertab: boolean = false;
  SelectionType = SelectionType;

  minDate: Date;
  maxDate: Date;
  CurrentTime : Date;
  RequestlistForm: FormGroup;
  items: any[] = [];
  getItemSub: Subscription;
  Cols = [
    { field: 'PermitNo', header: 'Permit number' },
    { field: 'Activity', header: 'Activity' },
    { field: 'subContractorName', header: 'Sub Contractor' },
    { field: 'Working_Date', header: 'Working Date' },
    { field: 'Start_Time', header: 'Start Time' },
    { field: 'End_Time', header: 'End Time' },
    { field: 'Request_status', header: 'Status' },
  ];

  getFloors = [
    'LK1',
    'L00',
    'L01',
    'L02',
    'L03',
    'L04',
    'L05',
    'L06',
    'L07',
    'L08',
    'LTA'    
  ]

  Typeofactivitys: any[] = []
  Status: any[] = [
    {
      "Statusid": "Hold",
      "Statusname": "Hold"
    },
    {
      "Statusid": "Draft",
      "Statusname": "Draft"
    },
    {
      "Statusid": "Approved",
      "Statusname": "Approved"
    },
    {
      "Statusid": "Reject",
      "Statusname": "Rejected"
    },
    {
      "Statusid": "Opened",
      "Statusname": "Opened"
    },
    {
      "Statusid": "Closed",
      "Statusname": "Closed"
    }
  ]
  TypeS: any[] = [
    {
      "Typeid": 1,
      "Typename": "T"
    },
    {
      "Typeid": 2,
      "Typename": "S"
    },
    {
      "Typeid": 3,
      "Typename": "C"
    },

  ]

  SearchRequest: SearchRequestDto =
    {
      Activity: null,
      Site_Id: null,
      Sub_Contractor_Id: null,
      Request_status: null,
      PermitNo: null,
      fromDate: "",
      toDate:"",
      Type_Of_Activity_Id:null,
      Building_Id: null,
      Room_Type: null
    }

    RequestsbyidDto:RequestBySubcontractorId=
    {
      SubContractorId:null
    }
  Contractors: any[] = []
  Sites: any[] = []
  Buildings: any[] = [];
  userdata: any = {};
  isoperator: boolean = false;
  constructor(
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private confirmService: AppConfirmService,
    private loader: AppLoaderService,
    private userservices: UserService,
    private route: Router,
    private fb: FormBuilder,
    private subcntrservice: SubcontractorService,
    private requestservice: RequestService,
    private activityservice: ActivityService,
    private datePipe: DatePipe,
    private jwtauth: JwtAuthService
  ) {
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 20, 0, 1);
    this.maxDate = new Date(currentYear + 1, 11, 31);
    this.requestservice.SelectedRequestData = {};
  }

  ngOnInit() {
    console.log(this.CurrentTime, "TIME")
    console.log(Date(), "DATE");
    // var d = new Date();
    // var n = d.toLocaleString('da-DK', {
    //   timeZone: "Europe/Copenhagen",
    // });
    
    this.getItems();
    this.RequestlistForm = this.fb.group({
      Permitnumber: ['', Validators.required],
      TypeOfActivity: ['', Validators.required],
      Keyword: ['', Validators.required],
      WorkingDateFrom: ['', Validators.required],
      WorkingDateTo: ['', Validators.required],
      Status: ['', Validators.required],
      Contractor: ['', Validators.required],
      Site: ['', Validators.required],
      Building: ['', Validators.required],
      Level: ['', Validators.required]
    });
  }
  ngOnDestroy() {
    if (this.getItemSub) {
      this.getItemSub.unsubscribe()
    }
  }
  getItems() {
    //this.items = this.userservices.RequestLists;
    this.spinner = true;

    forkJoin(this.requestservice.GetAllRequests(), this.subcntrservice.GetAllSubContractors(), this.requestservice.GetAllSites(),
      this.activityservice.GetAllActivites()).subscribe(res => {
        this.spinner = false;

        if (res[0]["message"] == "No Requests Found") {
          this.items = [];
          this.Filtertab = false;
        }
        else {
        
          this.Filtertab = true;
          this.userdata = this.jwtauth.getUser();

          if (this.userdata["role"] == "Subcontractor") {
            this.isoperator = false;
            this.IsNotSubCntr=false;
            this.RequestlistForm.controls["Contractor"].setValue(this.userdata["typeId"]);
            this.RequestsbyidDto.SubContractorId=this.userdata["typeId"];
            this.requestservice.GetAllRequestsByid(this.RequestsbyidDto).subscribe(res=>
              {
                this.items=res["data"];
              });
          }
          else if (this.userdata["role"] == "Admin") {
            this.IsNotSubCntr=true;
            this.items = res[0]["data"];
            this.isoperator = true;
            this.isoperator = true;
            var filteritems = [];
            this.items.forEach(x => {
              if (x["Request_status"] != "Draft") {
                filteritems.push(x);
              }
            });
            this.items = [];
            this.items.length = 0;
            this.items = filteritems;

          }
          else if (this.userdata["role"] == "Department") {
            this.IsNotSubCntr=true;
            this.items = res[0]["data"];
            this.isoperator = true;
            var filteritems = [];
            this.items.forEach(x => {
              if (x["Request_status"] != "Draft") {
                filteritems.push(x);
              }
            });
            this.items = [];
            this.items.length = 0;
            this.items = filteritems;
          }
        }

        this.Contractors = res[1]["data"];
        this.Sites = res[2]["data"];
        this.Getbuilding(this.Sites[1]["site_id"]);
        this.Typeofactivitys = res[3]["data"];
      });
    // this.requestservice.GetAllRequests().subscribe(x=>
    //   {
    //     this.spinner=false;
    //     this.items=x["data"];
    //   });

    // this.subcntrservice.GetAllSubContractors().subscribe(x=>
    //   {
    //     this.Contractors=x["data"];
    //   });
    //   this.requestservice.GetAllSites().subscribe(x=>
    //     {
    //       this.Sites=x["data"];
    //     });



  }
  Getbuilding(event) {
    this.spinner = true;
    this.requestservice.GetAllBuildingsbyid(event).subscribe(x => {
      this.spinner = false;
      this.Buildings = x["data"];
    });
  }

  openPopUp(data) {
    let title = 'Request';
    let dialogRef: MatDialogRef<any> = this.dialog.open(ListPopupComponent, {
      width: '1200px',
      height: '600px',
      disableClose: false,
      data: { title: title, payload: data }
    })
    dialogRef.afterClosed()
      .subscribe(res => {
        this.getItems();
        if (!res) {
          // If user press cancel
          return;
        }
      });
  }
  deleteItem(row) {
    this.confirmService.confirm({ message: `Delete ${row.name}?` })
      .subscribe(res => {
      })
  }
  addrequest() {
    this.route.navigateByUrl('user/new-request');
  }

  search() {
    console.log(this.RequestlistForm.controls.Level, "Level");
    this.spinner = true;
    this.SearchRequest.Room_Type = this.RequestlistForm.controls["Level"].value;
    this.SearchRequest.Building_Id = this.RequestlistForm.controls["Building"].value;
    this.SearchRequest.Activity =this.RequestlistForm.controls["Keyword"].value;
    this.SearchRequest.PermitNo = this.RequestlistForm.controls["Permitnumber"].value;
    this.SearchRequest.Request_status = this.RequestlistForm.controls["Status"].value;
    this.SearchRequest.Site_Id = this.RequestlistForm.controls["Site"].value;
    this.SearchRequest.Sub_Contractor_Id = this.RequestlistForm.controls["Contractor"].value;
    this.SearchRequest.Type_Of_Activity_Id=this.RequestlistForm.controls["TypeOfActivity"].value;
    var mydate = this.datePipe.transform(this.RequestlistForm.controls["WorkingDateFrom"].value, 'yyyy-MM-dd');
    var todate = this.datePipe.transform(this.RequestlistForm.controls["WorkingDateTo"].value, 'yyyy-MM-dd');

    if(mydate!=null)
    {
      this.SearchRequest.fromDate = mydate;
    }
    if(todate!=null)
    {
      this.SearchRequest.toDate=todate;
    }
 
    this.requestservice.SearchRequest(this.SearchRequest).subscribe(res => {
      if (res["message"] == "No Requests Found") {
        this.items = [];
        this.Filtertab = true;
        this.spinner = false;
      }
      else {
        this.items = res["data"];
        this.Filtertab = true;
        this.spinner = false;
      }
    });

  }

  exportToExcel() {
    const rowsString: string[] = [];
    let headerString = '';
    let csv = '';

    this.ModalOptions = {
      key: '',
      fileName: '',
      dialogHeader: '',
      dialogMessage: '',
      enableDownloadExcel: true,
      enablePrint: true,
      dataSource: '',
      tableData: '',
      columns: this.Cols,
      reportHeaderColumns: '',
      reportFooterColumns: ''

    };

    this.ModalOptions.tableData = this.items;

    this.ModalOptions.fileName = "test" + "_" + moment(new Date()).format('YYYY/MM/DD').toString();

    for (const column of this.ModalOptions.columns) {
      let data = column.header;
      data = data === 'undefined' ? '' : data;
      data = data === null ? '' : data;
      data = data === 'null' ? '' : data;
      headerString += data + ',';

    }
    csv += headerString + '\n';

    for (let i = 0; i < this.ModalOptions.tableData.length; i++) {
      let rowString = '';
      let colNames = '';
      let objValues = {};
      let val = '';

      const tableRow = this.ModalOptions.tableData[i];
      for (const column of this.ModalOptions.columns) {
        if (column.field.includes('.')) {
          colNames = column.field.split('.');
          objValues = tableRow[colNames[0]];
          val = String(objValues[colNames[1]])
            .replace(/[\n\r]+/g, '')
            .replace(/\s{2,}/g, ' ')
            .replace(/,/g, '')
            .trim();
          val = val === 'true' ? '1' : val === 'false' ? '0' : val;
          val = val === null ? '' : val;
          val = val === 'null' ? '' : val;
          val = val === '0' ? '' : val;
          val = val === 'undefined' ? '' : val;
          rowString += val + ',';
        } else {
          val = String(tableRow[column.field])
            .replace(/[\n\r]+/g, '')
            .replace(/\s{2,}/g, ' ')
            .replace(/,/g, '')
            .trim();
          val = val === 'true' ? '1' : val === 'false' ? '0' : val;
          val = val === null ? '' : val;
          val = val === 'null' ? '' : val;
          val = val === '0' ? '' : val;
          val = val === 'undefined' ? '' : val;
          rowString += val + ',';
        }
      }
      rowsString.push(rowString);
    }

    for (const row of rowsString) {
      csv += row + '\n';
    }

    csv += this.ModalOptions.reportFooterColumns + '\n';
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.setAttribute('href', window.URL.createObjectURL(blob));
    link.setAttribute(
      'download',
      this.ModalOptions.fileName + this.ModalOptions.key + '.csv'
    );
    document.body.appendChild(link); 
    link.click();
  }

  Editrow(row) {

    this.requestservice.SelectedRequestData =
    {
      "payload": row,
      "editform": true
    };
    this.route.navigateByUrl("/user/new-request");

    // let title = 'Request';
    // let dialogRef: MatDialogRef<any> = this.dialog.open(NewRequestComponent, {
    //   width: '1200px',
    //   height: '600px',
    //   disableClose: false,
    //   data: { title: title, payload: row,editform:true }
    // })
    // dialogRef.afterClosed()
    //   .subscribe(res => {

    //   })
  }
  CopyRequest(row,status) {
    if(status=="Closed")
    {
      row["Request_status"]="Hold";
      let currentdate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
      row["Request_Date"]=currentdate;
    }
    let title = 'Copy Request';
    let dialogRef: MatDialogRef<any> = this.dialog.open(CopyRequestComponent, {
      width: '1200px',
      height: '300px',
      disableClose: false,
      data: { title: title, payload: row, copyform: true }
    })
    dialogRef.afterClosed()
      .subscribe(res => {
        this.getItems();
      });
  }

  ChangeStaus(row) {
    let title = 'Request Status Change ';
    let type = "operartor";
    console.log(row);
    let dialogRef: MatDialogRef<any> = this.dialog.open(StatusChangeDialogComponent, {
      width: '300px',
      height: '150px',
      disableClose: false,
      data: { title: title, payload: row, type: type }
    })
    dialogRef.afterClosed()
      .subscribe(res => {
        this.getItems();
      });
  }
  ChangeStausbysubcontractor(row, status) {
    console.log(config.Denmarktz.split(' '));
    const [currentDenmarkDate,currentDenmarkTime]= [...config.Denmarktz.split(' ')];
    console.log(currentDenmarkTime);
    console.log(currentDenmarkDate)
    let title = 'Request Status Change ';
    let type = status;
    if (status == "Opened") {
      
      var currentdate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
      var mydate = this.datePipe.transform(row["Working_Date"], 'yyyy-MM-dd');
      if (currentdate === mydate) {
        let dialogRef: MatDialogRef<any> = this.dialog.open(StatusChangeDialogComponent, {


          disableClose: false,
          data: { title: title, payload: row, type: type }
        })
        dialogRef.afterClosed()
          .subscribe(res => {
            this.getItems();
          });
      }
    }
    else if (status == "Closed") {

      let dialogRef: MatDialogRef<any> = this.dialog.open(StatusChangeDialogComponent, {
        disableClose: false,
        width:'600px',
        data: { title: title, payload: row, type: type }
      })
      dialogRef.afterClosed()
        .subscribe(res => {
          this.getItems();
        });
    }
  }

  Deleterequest(row) {
    let title = 'Delete Request';
    let dialogRef: MatDialogRef<any> = this.dialog.open(DeleteOptionComponent, {
      width: '300px',
      height: '150px',
      disableClose: false,
      data: { title: title, payload: row, type: "request" }
    })
    dialogRef.afterClosed()
      .subscribe(res => {
        this.getItems();
      });
  }
  statuschange(statusdata) {

    this.selectedRequestIds.length = 0;

    this.selected.forEach(x => {
      if (x["Request_status"] == "Hold") {
        this.selectedRequestIds.push(x["id"]);
      }
    });


    let title = 'Do you want ' + statusdata + " Items";
    let dialogRef: MatDialogRef<any> = this.dialog.open(RequestSaveOptionsDialogComponent, {
      width: '300px',
      height: '150px',
      disableClose: false,
      data: { title: title, payload: this.selectedRequestIds.toString(), statustype: statusdata, listitemsstatus: true }
    })
    dialogRef.afterClosed()
      .subscribe(res => {
        this.selected.length=0;
        this.selected=[];
        this.ngOnInit();
      });
  }

  onSelect({ selected }) {

    this.selected = selected;

    //this.selected.splice(0, this.selected.length);
    //this.selected.push(...selected);
  }

  onActivate(event) {
    console.log(event);
  }

  DeleteDepart(row) {
    let title = 'Delete Request';
    let dialogRef: MatDialogRef<any> = this.dialog.open(DeleteOptionComponent, {
      width: '300px',
      height: '150px',
      disableClose: false,
      data: { title: title, payload: row, type: "request" }
    })
    dialogRef.afterClosed()
      .subscribe(res => {
        this.getItems();
      });
  }

  EditDraft(row)
  {
    console.log(row);
    this.requestservice.SelectedRequestData =
    {
      "payload": row,
      "editform": true
    };
    this.route.navigateByUrl("/user/new-request");
  }

  Getselected(event)
  {
    console.log(event);
    this.selected.forEach(x => {
      if (x["Request_status"] == "Hold") {
        this.selectedRequestIds.push(x["id"]);
      }
    });

    if(event!="none")
    {
      let title=event;
      let dialogRef: MatDialogRef<any> = this.dialog.open(EditRequestComponent, {
        width: '800px',
        height: '200px',
        disableClose: false,
        data: { title: title,payload: this.selectedRequestIds.toString()}
      })
      dialogRef.afterClosed()
        .subscribe(res => {
          this.selectedRequestIds.length=0;
          this.selectedRequestIds=[];
          this.getItems();
        });
    }
    }
    Reset()
    {
      this.RequestlistForm.reset();
      this.SearchRequest.fromDate=null;
      this.SearchRequest.toDate=null;      
    }
}
