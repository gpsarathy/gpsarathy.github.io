import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/react/ui/accordion"

export default function(){
    return <>
    <Accordion type="multiple">
    <AccordionItem value="item-1" >
      <AccordionTrigger>Programming Languages</AccordionTrigger>
      <AccordionContent>
      Java, Javascript, Typescript, GoLang
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Technologies</AccordionTrigger>
      <AccordionContent>
      Web, REST API, GraphQL
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-3">
      <AccordionTrigger>Scripting Languages</AccordionTrigger>
      <AccordionContent>
      Terraform, HTML, CSS, Shell
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-4">
      <AccordionTrigger>Frameworks and UI</AccordionTrigger>
      <AccordionContent>
      Spring Boot, NodeJS, ReactJS, Angular 6, Astro ( This site built on <b className=" text-lg">🚀</b> )
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-5">
      <AccordionTrigger>Persistence</AccordionTrigger>
      <AccordionContent>
      SQL, No-SQL, Postgres, MongoDB, Hibernate, Firestore, Firebase
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-6">
      <AccordionTrigger>Cloud & CI/CD</AccordionTrigger>
      <AccordionContent>
      Google Cloud Platform, AWS, Harness, Open-Shift Tekton
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-7">
      <AccordionTrigger>Other Interests</AccordionTrigger>
      <AccordionContent>
      ML (Python), Cross Platform development ( Basics of Flutter, Dart, ReactNaive), Game Development (Unreal Engine, C++, Godot and Etc)
      </AccordionContent>
    </AccordionItem>
  </Accordion>
  </>
}