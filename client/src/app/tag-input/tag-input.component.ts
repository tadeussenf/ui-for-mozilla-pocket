import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from "@angular/core";
import {MatChipInputEvent, MatChipList} from "@angular/material/chips";
import {FormControl} from "@angular/forms";
import {COMMA, ENTER, MAC_ENTER, SPACE} from "@angular/cdk/keycodes";
import {Subscription} from "rxjs";
import {StateService} from "../state.service";
import {debounceTime} from "rxjs/operators";
import {Tag} from "../../common/interfaces";

@Component({
  selector: "app-tag-input",
  templateUrl: "./tag-input.component.html",
  styleUrls: ["./tag-input.component.scss"]
})
export class TagInputComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() tags: Tag[];
  @Input() itemTags: string[];
  @Input() inline: boolean = false;
  @Output() updatedTags = new EventEmitter<string[]>();
  @Output() removedTags = new EventEmitter<string[]>();

  @ViewChild("input") input: ElementRef;
  @ViewChild("chipList") chipList: MatChipList;

  tagInput: FormControl = new FormControl();
  separatorKeysCodes = [COMMA, SPACE, ENTER, MAC_ENTER];
  filteredTags: Tag[];
  private tagList: string[];
  private tagInputSub: Subscription;

  // we need to do some ugly stuff in order to get both chips and autocomplete working
  // todo use https://github.com/Gbuomprisco/ngx-chips

  constructor(
    public state: StateService
  ) {
  }

  ngOnInit(): void {
    this.tagList = this.tags.map(tag => tag.name);
    this.filteredTags = this.tags;

    this.tagInputSub = this.tagInput.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        console.log("filter");
        this.filteredTags = this.tags.filter(item => item.name.toLowerCase().startsWith(value.toLowerCase())).slice(0, 10);
      });
  }

  ngAfterViewInit() {
    if (!this.inline) {
      setTimeout(() => {
        this.chipList._focusInput();
      }, 1000);
    }
  }

  add(event: MatChipInputEvent): void {
    console.log("add", event.value);
    if (event.value.length > 0 && this.itemTags.indexOf(event.value) < 0) { // does not exist
      console.log("add value", event.value);
      this.itemTags.push(event.value);
      event.input.value = "";
      if (this.inline) {
        this.doSubmit();
      }
    } else {
      console.log("remove input");
      event.input.value = "";
    }
  }

  addFromAutocomplete($event) {
    console.log("auto", $event.option.value);
    this.input.nativeElement.value = "";
    this.add({value: $event.option.value, input: {value: ""}} as MatChipInputEvent);
  }

  remove(tag: string): void {
    this.removedTags.emit([tag])
  }

  doSubmit() {
    this.updatedTags.emit(this.itemTags);
  }

  ngOnDestroy(): void {
    this.tagInputSub.unsubscribe();
  }

  filterByTag(tag: string) {
    this.state.filterByTag(tag);
  }
}
