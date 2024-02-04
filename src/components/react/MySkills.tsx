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
      Java, Javascript, Typescript, Python
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Scripting Languages</AccordionTrigger>
      <AccordionContent>
      Terraform, HTML, CSS, Shell, JSP
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-3">
      <AccordionTrigger>Frameworks and UI</AccordionTrigger>
      <AccordionContent>
      Spring Boot, NodeJS, ReactJS Angular 6+, Astro ( This site built on <b className=" text-lg">🚀</b> )
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-4">
      <AccordionTrigger>Persistence</AccordionTrigger>
      <AccordionContent>
      SQL, No-SQL, MySQL, MongoDB, Hibernate, Firestore, Firebase
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-5">
      <AccordionTrigger>Cloud & CI/CD</AccordionTrigger>
      <AccordionContent>
      Google Cloud Platform, AWS, Harness, Open-Shift Tekton
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-6">
      <AccordionTrigger>Others</AccordionTrigger>
      <AccordionContent>
      Basics of Flutter, Dart, Unreal Engine, C++ and Etc
      </AccordionContent>
    </AccordionItem>
  </Accordion>

  </>
}